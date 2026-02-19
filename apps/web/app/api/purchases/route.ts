import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, supplier, userId } = body;

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
                    userId: userId || 'admin-user',
                }
            });

            for (const item of items) {
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
                            batchNumber: item.batchNumber,
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                            expiryDate: new Date(item.expiryDate)
                        }
                    });
                }

                await tx.stockMovement.create({
                    data: {
                        type: 'IN',
                        quantity: item.quantity,
                        productId: item.productId,
                        batchId: batch.id,
                        reason: `Livraison: ${supplier || 'Fournisseur'}`,
                        userId: userId || 'admin-user',
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
