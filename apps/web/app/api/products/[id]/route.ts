import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// ─── PATCH : Modifier un produit ──────────────────────────────────────────
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'PHARMACIST'].includes(session.user.role as string)) {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, dci, category, sellingPrice, minThreshold } = body;

        const updated = await prisma.product.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(dci !== undefined && { dci }),
                ...(category && { category }),
                ...(sellingPrice && { sellingPrice: Number(sellingPrice) }),
                ...(minThreshold && { minThreshold: Number(minThreshold) }),
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Product PATCH Error:", error);
        return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }
}

// ─── DELETE : Supprimer un produit (et ses lots) ──────────────────────────
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Seul un ADMIN peut supprimer un produit" }, { status: 403 });
        }

        const { id } = await params;

        // 1. Vérifier si le produit a des mouvements de stock (ledger immuable)
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        movements: true,
                        batches: true
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
        }

        const hasActivity = product._count.movements > 0;

        if (hasActivity) {
            // Si le produit a de l'activité, on l'archive (soft delete)
            await prisma.product.update({
                where: { id },
                data: { status: 'INACTIF' }
            });
            return NextResponse.json({
                success: true,
                message: "Produit archivé (données historiques conservées)"
            });
        } else {
            // Si aucune activité, on supprime définitivement
            // Supprimer les lots d'abord (contrainte FK)
            await prisma.batch.deleteMany({ where: { productId: id } });
            await prisma.product.delete({ where: { id } });
            return NextResponse.json({
                success: true,
                message: "Produit supprimé définitivement"
            });
        }
    } catch (error) {
        console.error("Product DELETE Error:", error);
        return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }
}
