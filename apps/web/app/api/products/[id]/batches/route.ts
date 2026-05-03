import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const productWithBatches = await prisma.product.findUnique({
            where: { id: params.id },
            include: {
                batches: {
                    orderBy: { expiryDate: 'asc' }
                }
            }
        });

        if (!productWithBatches) {
            return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
        }

        return NextResponse.json(productWithBatches.batches);
    } catch (error) {
        console.error("Batches Fetch Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
