import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();

        // Sécurité : Accès restreint aux utilisateurs authentifiés
        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const salesToday = await prisma.transaction.findMany({
            where: {
                type: 'SALE',
                createdAt: { gte: today },
                status: 'COMPLETED'
            }
        });

        const dailyRevenue = salesToday.reduce((sum: number, tx: { amount: unknown }) => sum + Number(tx.amount), 0);

        const allProducts = await prisma.product.findMany({
            include: {
                batches: {
                    where: { quantity: { gt: 0 } }
                }
            }
        });

        let totalStockValue = 0;
        let outOfStockCount = 0;

        allProducts.forEach((product: { batches: { quantity: number }[]; sellingPrice: unknown }) => {
            const productQty = product.batches.reduce((sum: number, b: { quantity: number }) => sum + b.quantity, 0);
            if (productQty <= 0) outOfStockCount++;
            totalStockValue += productQty * Number(product.sellingPrice);
        });

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringBatches = await prisma.batch.findMany({
            where: {
                quantity: { gt: 0 },
                expiryDate: {
                    gt: new Date(),
                    lte: thirtyDaysFromNow
                }
            },
            include: {
                product: true
            }
        });

        return NextResponse.json({
            revenueToday: dailyRevenue,
            stockValue: totalStockValue,
            stockCount: allProducts.length,
            outOfStockCount: outOfStockCount,
            expiringBatches: expiringBatches.map((b: { batchNumber: string; expiryDate: Date; quantity: number; product: { name: string } }) => ({
                productName: b.product.name,
                batchNumber: b.batchNumber,
                expiryDate: b.expiryDate.toISOString(),
                quantity: b.quantity
            }))
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
