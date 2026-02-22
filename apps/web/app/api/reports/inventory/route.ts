import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // 1. Calcul de la valeur totale du stock (Prix d'achat)
        const batches = await prisma.batch.findMany({
            where: { quantity: { gt: 0 } },
            select: {
                quantity: true,
                costPrice: true,
                expiryDate: true,
                product: {
                    select: {
                        name: true,
                        category: true,
                        minThreshold: true
                    }
                }
            }
        });

        const totalValue = batches.reduce((acc, b) => acc + (b.quantity * Number(b.costPrice)), 0);

        // 2. Produits en alerte (en dessous du seuil mini)
        const products = await prisma.product.findMany({
            include: {
                batches: {
                    where: { quantity: { gt: 0 } }
                }
            }
        });

        const lowStockProducts = products.map(p => {
            const currentQty = p.batches.reduce((acc, b) => acc + b.quantity, 0);
            return {
                id: p.id,
                name: p.name,
                currentQty,
                minThreshold: p.minThreshold,
                isLow: currentQty < p.minThreshold
            };
        }).filter(p => p.isLow);

        // 3. Lots proches de péremption (moins de 6 mois)
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        const expiringSoon = batches
            .filter(b => b.expiryDate < sixMonthsFromNow)
            .map(b => ({
                product: b.product.name,
                qty: b.quantity,
                expiryDate: b.expiryDate,
                status: b.expiryDate < new Date() ? 'PÉRIMÉ' : 'CRITIQUE'
            }))
            .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

        return NextResponse.json({
            summary: {
                totalStockValue: totalValue,
                itemCount: batches.length,
                lowStockCount: lowStockProducts.length,
                expiringCount: expiringSoon.length
            },
            lowStockProducts,
            expiringSoon
        });

    } catch (error) {
        console.error("Report API Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
