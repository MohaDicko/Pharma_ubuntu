import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
                    userId: userId,
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
