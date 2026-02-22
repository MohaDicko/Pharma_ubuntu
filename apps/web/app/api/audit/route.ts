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

        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100,
            include: {
                user: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            }
        });

        const formatted = logs.map((log: any) => ({
            id: log.id,
            action: log.action,
            timestamp: log.timestamp,
            details: log.details,
            user: {
                name: log.user?.name || 'Système',
                role: log.user?.role || 'SYSTEM'
            }
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Audit API Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
