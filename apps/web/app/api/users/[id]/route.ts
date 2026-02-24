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

        // 1. Vérifier si l'utilisateur a une activité (transactions ou mouvements)
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        transactions: true,
                        stockMovements: true,
                        auditLogs: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }

        const hasActivity = user._count.transactions > 0 || user._count.stockMovements > 0;

        if (hasActivity) {
            // Si l'utilisateur a de l'activité, on désactive seulement (soft delete)
            await prisma.user.update({
                where: { id },
                data: { status: 'INACTIF' }
            });
            return NextResponse.json({
                success: true,
                message: "Utilisateur désactivé (données historiques conservées)"
            });
        } else {
            // Si aucune activité, on supprime définitivement
            // On peut supprimer les logs d'audit d'abord s'il y en a (bien que hasActivity vérifie transactions/mouvements)
            if (user._count.auditLogs > 0) {
                await prisma.auditLog.deleteMany({ where: { userId: id } });
            }
            await prisma.user.delete({ where: { id } });
            return NextResponse.json({
                success: true,
                message: "Utilisateur supprimé définitivement"
            });
        }
    } catch (error) {
        console.error("User DELETE API Error:", error);
        return NextResponse.json({ error: "Erreur lors de la suppression de l'utilisateur" }, { status: 500 });
    }
}
