import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

        const result = products.map((product) => {
            const totalStock = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);

            // Trouver la date de péremption la plus proche
            const nextExpiryDate = product.batches.length > 0
                ? product.batches.reduce((min, b) => b.expiryDate < min ? b.expiryDate : min, product.batches[0].expiryDate)
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

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const body = await req.json();
        const { dci, name, sellingPrice, minThreshold, category } = body;

        if (!name || !sellingPrice || !minThreshold) {
            return NextResponse.json({ error: "Données incomplètes (Nom, Prix et Seuil requis)" }, { status: 400 });
        }

        const newProduct = await prisma.product.create({
            data: {
                dci: dci || '',
                name,
                sellingPrice: Number(sellingPrice),
                minThreshold: Number(minThreshold),
                category: category || 'Divers'
            }
        });

        return NextResponse.json(newProduct);
    } catch (error) {
        console.error("Product POST Error:", error);
        return NextResponse.json({ error: "Erreur lors de la création du produit" }, { status: 500 });
    }
}
