import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // ── Authentification obligatoire ──────────────────────────
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        // ── Paramètres de pagination et filtres depuis l'URL ──────
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
        const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));
        const type = searchParams.get('type') ?? undefined;   // SALE | PURCHASE
        const method = searchParams.get('method') ?? undefined;   // CASH | CARD ...
        const status = searchParams.get('status') ?? undefined;
        const from = searchParams.get('from') ?? undefined;   // date ISO
        const to = searchParams.get('to') ?? undefined;   // date ISO

        // ── Construction du filtre Prisma ─────────────────────────
        const where: Record<string, unknown> = {};
        if (type) where.type = type;
        if (method) where.paymentMethod = method;
        if (status) where.status = status;
        if (from || to) {
            where.createdAt = {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
            };
        }

        const skip = (page - 1) * limit;

        // ── Requêtes parallèles : données + total ─────────────────
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    movements: {
                        include: { product: { select: { id: true, name: true, sellingPrice: true } } }
                    },
                    insurance: { select: { name: true } }
                }
            }),
            prisma.transaction.count({ where })
        ]);

        // ── Formatage de la réponse ───────────────────────────────
        const formatted = transactions.map((tx) => {
            const items = tx.movements.map((m) => ({
                id: m.product.id,
                name: m.product.name,
                quantity: Math.abs(m.quantity),
                price: Number(m.product.sellingPrice)
            }));

            return {
                id: tx.id,
                date: tx.createdAt,
                type: tx.type,
                amount: Number(tx.amount),
                paymentMethod: tx.paymentMethod,
                status: tx.status ?? 'COMPLETED',
                insuranceName: tx.insurance?.name ?? null,
                insurancePart: tx.insurancePart ? Number(tx.insurancePart) : 0,
                patientPart: tx.patientPart ? Number(tx.patientPart) : 0,
                items,
                products: items.map(i => `${i.name} (×${i.quantity})`).join(', '),
            };
        });

        return NextResponse.json({
            data: formatted,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            }
        });

    } catch (error) {
        console.error('Transactions API Error:', error);
        return NextResponse.json({ error: 'Erreur chargement transactions' }, { status: 500 });
    }
}
