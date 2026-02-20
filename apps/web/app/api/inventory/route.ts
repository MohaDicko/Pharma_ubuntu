import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                batches: {
                    where: { quantity: { gt: 0 } },
                    orderBy: { expiryDate: 'asc' }
                }
            }
        });

        const inventory = products.map((product: typeof products[number]) => {
            const totalQty = product.batches.reduce((sum: number, b: typeof product.batches[number]) => sum + b.quantity, 0);
            const nearestExpiry = product.batches.length > 0 ? product.batches[0].expiryDate : null;

            return {
                id: product.id,
                name: product.name,
                dci: product.dci,
                category: product.category,
                totalStock: totalQty,
                minThreshold: product.minThreshold,
                sellingPrice: Number(product.sellingPrice),
                nearestExpiry: nearestExpiry,
                status: totalQty <= 0 ? "Rupture" : totalQty <= product.minThreshold ? "Alerte" : "OK"
            };
        });

        return NextResponse.json(inventory);
    } catch (error) {
        console.error("Inventory Fetch Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
