import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { startOfDay, subDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'PHARMACIST')) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const stats = [];
        // Analyser les 7 derniers jours
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const start = startOfDay(date);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);

            const sales = await prisma.transaction.findMany({
                where: {
                    type: 'SALE',
                    createdAt: { gte: start, lte: end },
                    status: 'COMPLETED'
                }
            });

            const amount = sales.reduce((sum, tx) => sum + Number(tx.amount), 0);

            stats.push({
                name: format(date, 'dd/MM'),
                ventes: amount,
            });
        }

        // Répartition par mode de paiement (Aujourd'hui)
        const todayStart = startOfDay(new Date());
        const paymentStats = await prisma.transaction.groupBy({
            by: ['paymentMethod'],
            where: {
                type: 'SALE',
                createdAt: { gte: todayStart },
                status: 'COMPLETED'
            },
            _sum: {
                amount: true
            }
        });

        const paymentMethodData = paymentStats.map(stat => ({
            name: stat.paymentMethod,
            value: Number(stat._sum.amount || 0)
        }));

        return NextResponse.json({
            trends: stats,
            payments: paymentMethodData
        });

    } catch (error) {
        console.error("Reports API Error:", error);
        return NextResponse.json({ error: "Erreur lors du calcul des rapports" }, { status: 500 });
    }
}
