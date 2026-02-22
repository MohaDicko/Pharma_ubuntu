import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ─── GET : Liste tous les produits avec stock calculé ──────────────────────
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: 'asc' },
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
                status,
                nextExpiry: nextExpiryDate ? nextExpiryDate.toISOString() : null,
                batchesCount: product.batches.length
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Products GET Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// ─── POST : Créer un produit + son lot de stock initial ────────────────────
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const body = await req.json();
        const {
            name,
            dci,
            category,
            sellingPrice,
            minThreshold,
            // Lot initial (optionnel mais recommandé)
            initialQuantity,
            costPrice,
            expiryDate,
            batchNumber
        } = body;

        if (!name || !sellingPrice) {
            return NextResponse.json({ error: "Nom et Prix de vente sont requis" }, { status: 400 });
        }

        // Créer le produit + lot initial en une seule transaction atomique
        const newProduct = await prisma.product.create({
            data: {
                name,
                dci: dci || '',
                category: category || 'Divers',
                sellingPrice: Number(sellingPrice),
                minThreshold: Number(minThreshold) || 5,
                // Créer le lot initial si quantité fournie
                ...(initialQuantity && Number(initialQuantity) > 0 && {
                    batches: {
                        create: {
                            batchNumber: batchNumber || `LOT-${Date.now()}`,
                            quantity: Number(initialQuantity),
                            costPrice: Number(costPrice) || Number(sellingPrice) * 0.7,
                            expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 24 * 3600 * 1000) // +1 an par défaut
                        }
                    }
                })
            },
            include: {
                batches: true
            }
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error("Product POST Error:", error);
        return NextResponse.json({ error: "Erreur lors de la création du produit" }, { status: 500 });
    }
}
