import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';

const SaleSchema = z.object({
    paymentMethod: z.enum(['CASH', 'CARD', 'INSURANCE', 'MOBILE_MONEY']).optional().default('CASH'),
    insuranceId: z.string().uuid().optional().nullable(),
    insurancePart: z.number().nonnegative().optional(),
    patientPart: z.number().nonnegative().optional(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        sellingPrice: z.union([z.number().nonnegative(), z.string().transform(val => parseFloat(val))]),
    })).min(1, "Panier vide")
});

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // RBAC: Ventes autorisées pour CASHIER, PHARMACIST, ADMIN
        const userRole = session.user.role;
        const allowedRoles = ['CASHIER', 'PHARMACIST', 'ADMIN'];

        if (!userRole || !allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: "Accès refusé: Rôle insuffisant" }, { status: 403 });
        }

        const userId = session.user.id;

        // Rate Limiting
        const isAllowed = await rateLimit(`sales-${userId}`);
        if (!isAllowed) {
            return NextResponse.json({ error: "Trop de requêtes, veuillez patienter." }, { status: 429 });
        }

        const body = await req.json();

        // Validation Zod
        const validation = SaleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Données invalides", details: validation.error.format() }, { status: 400 });
        }

        const { items, paymentMethod, insuranceId, insurancePart, patientPart } = validation.data;

        const result = await prisma.$transaction(async (tx: any) => {
            let totalAmount = 0;

            const transaction = await tx.transaction.create({
                data: {
                    type: 'SALE',
                    amount: 0,
                    paymentMethod: paymentMethod,
                    status: 'COMPLETED',
                    userId: userId,
                    insuranceId: insuranceId,
                    insurancePart: insurancePart || 0,
                    patientPart: patientPart || 0
                }
            });

            for (const item of items) {
                const batches = await tx.batch.findMany({
                    where: {
                        productId: item.productId,
                        quantity: { gt: 0 },
                        expiryDate: { gt: new Date() }
                    },
                    orderBy: { expiryDate: 'asc' }
                });

                let remainingQtyToDeduct = item.quantity;

                for (const batch of batches) {
                    if (remainingQtyToDeduct <= 0) break;

                    const deduct = Math.min(batch.quantity, remainingQtyToDeduct);

                    await tx.batch.update({
                        where: { id: batch.id },
                        data: { quantity: { decrement: deduct } }
                    });

                    await tx.stockMovement.create({
                        data: {
                            type: 'OUT',
                            quantity: -deduct,
                            reason: 'Vente POS',
                            productId: item.productId,
                            batchId: batch.id,
                            userId: userId,
                            transactionId: transaction.id
                        }
                    });

                    remainingQtyToDeduct -= deduct;
                }

                if (remainingQtyToDeduct > 0) {
                    throw new Error(`Stock insuffisant pour le produit ${item.productId}`);
                }

                totalAmount += item.quantity * Number(item.sellingPrice);
            }

            await tx.transaction.update({
                where: { id: transaction.id },
                data: { amount: totalAmount }
            });

            await createAuditLog(userId, 'CREATE_SALE', {
                transactionId: transaction.id,
                amount: totalAmount,
                itemCount: items.length
            });

            return { transaction };
        });

        return NextResponse.json({
            success: true,
            transactionId: result.transaction.id
        });

    } catch (error) {
        console.error("Erreur Vente:", error);
        return NextResponse.json({ error: (error as Error).message || "Erreur interne" }, { status: 500 });
    }
}
