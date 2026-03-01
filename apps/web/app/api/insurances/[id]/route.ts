import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const UpdateSchema = z.object({
    name: z.string().min(2).optional(),
    code: z.string().optional(),
    percentage: z.number().int().min(0).max(100).optional(),
    status: z.enum(['ACTIF', 'INACTIF']).optional(),
});

// ── PATCH : Modifier une assurance ──────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès restreint aux administrateurs' }, { status: 403 });
        }

        const body = await req.json();
        const validation = UpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Données invalides', details: validation.error.format() }, { status: 400 });
        }

        const updated = await prisma.insurance.update({
            where: { id: params.id },
            data: validation.data,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Insurance PATCH Error:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

// ── DELETE : Désactiver (soft delete) une assurance ─────────────────────────
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès restreint aux administrateurs' }, { status: 403 });
        }

        // Soft delete : on désactive plutôt que de supprimer (préserve l'historique)
        const updated = await prisma.insurance.update({
            where: { id: params.id },
            data: { status: 'INACTIF' },
        });

        return NextResponse.json({ message: `Assurance "${updated.name}" désactivée`, insurance: updated });
    } catch (error) {
        console.error('Insurance DELETE Error:', error);
        return NextResponse.json({ error: 'Erreur lors de la désactivation' }, { status: 500 });
    }
}
