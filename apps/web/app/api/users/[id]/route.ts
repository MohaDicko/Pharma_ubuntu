import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { role, status } = body;

        // Éviter de se rétrograder soi-même ou de se désactiver
        if (id === session.user.id) {
            return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre compte ici" }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(role && { role }),
                ...(status && { status })
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("User PATCH API Error:", error);
        return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        const { id } = await params;

        if (id === session.user.id) {
            return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
        }

        // Pour la sécurité, on préfère souvent désactiver
        await prisma.user.update({
            where: { id },
            data: { status: 'INACTIF' } as any
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("User DELETE API Error:", error);
        return NextResponse.json({ error: "Erreur lors de la désactivation" }, { status: 500 });
    }
}
