import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, paymentMethod } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Panier vide" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            let totalAmount = 0;

            const transaction = await tx.transaction.create({
                data: {
                    type: 'SALE',
                    amount: 0,
                    paymentMethod: paymentMethod || 'CASH',
                    status: 'COMPLETED',
                    userId: 'admin-user',
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
                            userId: 'admin-user',
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
