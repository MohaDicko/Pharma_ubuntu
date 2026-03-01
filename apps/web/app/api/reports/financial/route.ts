import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'PHARMACIST'].includes(session.user.role as string)) {
            return NextResponse.json({ error: 'Accès restreint' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        // Mois cible (défaut : mois courant)
        const monthParam = searchParams.get('month'); // format YYYY-MM
        const targetDate = monthParam ? new Date(`${monthParam}-01`) : new Date();
        const start = startOfMonth(targetDate);
        const end = endOfMonth(targetDate);

        // ── 1. Ventes du mois ──────────────────────────────────────
        const sales = await prisma.transaction.findMany({
            where: { type: 'SALE', status: 'COMPLETED', createdAt: { gte: start, lte: end } },
            include: {
                movements: {
                    include: {
                        product: { select: { name: true, sellingPrice: true } },
                        batch: { select: { costPrice: true } }
                    }
                },
                insurance: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' }
        });

        // ── 2. Achats du mois ──────────────────────────────────────
        const purchases = await prisma.transaction.aggregate({
            where: { type: 'PURCHASE', createdAt: { gte: start, lte: end } },
            _sum: { amount: true },
            _count: true,
        });

        // ── 3. Calculs financiers ──────────────────────────────────
        const totalRevenue = sales.reduce((s, t) => s + Number(t.amount), 0);
        const totalCOGS = sales.reduce((s, tx) =>
            s + tx.movements.reduce((ms, m) => ms + (Math.abs(m.quantity) * Number(m.batch?.costPrice ?? 0)), 0), 0);
        const grossMargin = totalRevenue - totalCOGS;
        const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
        const totalPurchases = Number(purchases._sum.amount ?? 0);

        // ── 4. Répartition par mode de paiement ───────────────────
        const byPayment: Record<string, number> = {};
        for (const tx of sales) {
            const key = tx.paymentMethod;
            byPayment[key] = (byPayment[key] ?? 0) + Number(tx.amount);
        }

        // ── 5. Top 10 produits vendus (quantité + CA) ─────────────
        const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
        for (const tx of sales) {
            for (const mv of tx.movements) {
                const pid = mv.productId;
                if (!productMap[pid]) productMap[pid] = { name: mv.product.name, qty: 0, revenue: 0 };
                productMap[pid].qty += Math.abs(mv.quantity);
                productMap[pid].revenue += Math.abs(mv.quantity) * Number(mv.product.sellingPrice);
            }
        }
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // ── 6. Trending par jour du mois ──────────────────────────
        const dailyMap: Record<string, number> = {};
        for (const tx of sales) {
            const day = format(new Date(tx.createdAt), 'dd/MM', { locale: fr });
            dailyMap[day] = (dailyMap[day] ?? 0) + Number(tx.amount);
        }
        const dailyTrend = Object.entries(dailyMap)
            .map(([day, amount]) => ({ day, amount }))
            .sort((a, b) => {
                const [da, ma] = a.day.split('/').map(Number);
                const [db, mb] = b.day.split('/').map(Number);
                return ma !== mb ? ma - mb : da - db;
            });

        // ── 7. Comparaison avec mois précédent ────────────────────
        const prevStart = startOfMonth(subMonths(targetDate, 1));
        const prevEnd = endOfMonth(subMonths(targetDate, 1));
        const prevRevenue = await prisma.transaction.aggregate({
            where: { type: 'SALE', status: 'COMPLETED', createdAt: { gte: prevStart, lte: prevEnd } },
            _sum: { amount: true },
        });
        const prevTotal = Number(prevRevenue._sum.amount ?? 0);
        const revenueGrowth = prevTotal > 0 ? ((totalRevenue - prevTotal) / prevTotal) * 100 : null;

        return NextResponse.json({
            period: {
                month: format(targetDate, 'MMMM yyyy', { locale: fr }),
                start: start.toISOString(),
                end: end.toISOString(),
            },
            summary: {
                totalRevenue,
                totalCOGS,
                grossMargin,
                grossMarginPct: Math.round(grossMarginPct * 10) / 10,
                totalPurchases,
                netCash: totalRevenue - totalPurchases,
                salesCount: sales.length,
                revenueGrowth: revenueGrowth !== null ? Math.round(revenueGrowth * 10) / 10 : null,
                prevRevenue: prevTotal,
            },
            byPayment: Object.entries(byPayment).map(([method, amount]) => ({ method, amount })),
            topProducts,
            dailyTrend,
        });

    } catch (error) {
        console.error('Financial Report Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
