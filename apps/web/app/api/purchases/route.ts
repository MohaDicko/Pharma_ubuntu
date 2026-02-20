import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const PurchaseSchema = z.object({
    supplier: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        batchNumber: z.string().min(1),
        quantity: z.number().int().positive(),
        costPrice: z.union([z.number().nonnegative(), z.string().transform(val => parseFloat(val))]),
        expiryDate: z.string().refine(val => !isNaN(Date.parse(val)), "Date invalide"),
    })).min(1, "Aucun produit réceptionné")
});

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // RBAC: Achats autorisés uniquement pour PHARMACIST et ADMIN
        const userRole = session.user.role;
        const allowedRoles = ['PHARMACIST', 'ADMIN'];

        if (!userRole || !allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: "Accès refusé: Rôle insuffisant" }, { status: 403 });
        }

        const operatorId = session.user.id;

        // Rate Limiting
        const isAllowed = await rateLimit(`purchases-${operatorId}`);
        if (!isAllowed) {
            return NextResponse.json({ error: "Trop de requêtes, veuillez patienter." }, { status: 429 });
        }

        const body = await req.json();

        // Validation Zod
        const validation = PurchaseSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Données invalides", details: validation.error.format() }, { status: 400 });
        }

        const { items, supplier } = validation.data;

        const result = await prisma.$transaction(async (tx: any) => {
            let totalCost = 0;

            const transaction = await tx.transaction.create({
                data: {
                    type: 'PURCHASE',
                    amount: 0,
                    paymentMethod: 'INVOICE',
                    status: 'COMPLETED',
                    userId: operatorId,
                }
            });

            for (const item of items) {
                // Check if batch exists (by number AND product) or maybe just by ID if existing? Default logic seems fine.
                let batch = await tx.batch.findFirst({
                    where: {
                        productId: item.productId,
                        batchNumber: item.batchNumber
                    }
                });

                const expiryDate = new Date(item.expiryDate);

                if (batch) {
                    await tx.batch.update({
                        where: { id: batch.id },
                        data: { quantity: { increment: item.quantity } }
                    });
                } else {
                    batch = await tx.batch.create({
                        data: {
                            productId: item.productId,
                            batchNumber: item.batchNumber, // Ensure unique constraint doesn't fail if modeled? Currently only productId+batchNumber logical unique
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                            expiryDate: expiryDate
                        }
                    });
                }

                await tx.stockMovement.create({
                    data: {
                        type: 'IN', // Enums should be used if possible but string works if matches
                        quantity: item.quantity,
                        productId: item.productId,
                        batchId: batch.id,
                        reason: `Livraison: ${supplier || 'Fournisseur'}`,
                        userId: operatorId,
                        transactionId: transaction.id
                    }
                });

                totalCost += item.quantity * Number(item.costPrice);
            }

            await tx.transaction.update({
                where: { id: transaction.id },
                data: { amount: totalCost }
            });

            return { transaction };
        });

        return NextResponse.json({
            success: true,
            transactionId: result.transaction.id,
            itemsCount: items.length
        });

    } catch (error) {
        console.error("Erreur Achat:", error);
        return NextResponse.json({ error: (error as Error).message || "Erreur interne" }, { status: 500 });
    }
}
