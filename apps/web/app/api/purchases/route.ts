import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
        const body = await req.json();
        const { items, supplier } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Aucun produit réceptionné" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
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
                            expiryDate: new Date(item.expiryDate)
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
