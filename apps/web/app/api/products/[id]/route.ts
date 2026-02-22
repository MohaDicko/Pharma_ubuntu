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

        // Vérifier si le produit a des mouvements de stock (ledger immuable)
        const movementCount = await prisma.stockMovement.count({ where: { productId: id } });
        if (movementCount > 0) {
            return NextResponse.json({
                error: `Impossible de supprimer : ce produit a ${movementCount} mouvement(s) de stock enregistré(s). Archivage recommandé.`
            }, { status: 409 });
        }

        // Supprimer les lots d'abord (contrainte FK)
        await prisma.batch.deleteMany({ where: { productId: id } });
        await prisma.product.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Product DELETE Error:", error);
        return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }
}
