import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                batches: {
                    where: {
                        quantity: { gt: 0 },
                        expiryDate: { gt: new Date() }
                    }
                }
            }
        });

        const result = products.map((product: typeof products[number]) => {
            const totalStock = product.batches.reduce((sum: number, batch: typeof product.batches[number]) => sum + batch.quantity, 0);

            // Trouver la date de péremption la plus proche
            const nextExpiryDate = product.batches.length > 0
                ? product.batches.reduce((min: Date, b: typeof product.batches[number]) => b.expiryDate < min ? b.expiryDate : min, product.batches[0].expiryDate)
                : null;

            let status = 'OK';
            if (totalStock <= 0) status = 'RUPTURE';
            else if (totalStock <= product.minThreshold) status = 'LOW';

            return {
                ...product,
                stock: totalStock,
                sellingPrice: Number(product.sellingPrice),
                status: status,
                nextExpiry: nextExpiryDate ? nextExpiryDate.toISOString() : null,
                batchesCount: product.batches.length
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Products API Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
