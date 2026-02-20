import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                movements: {
                    include: {
                        product: true
                    }
                }
            }
        });

        const formatted = transactions.map((tx: typeof transactions[number]) => {
            const items = tx.movements.map((m: typeof transactions[number]['movements'][number]) => ({
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
                items,
                products: items.map((i: typeof items[number]) => `${i.name} (${i.quantity})`).join(', '),
                status: tx.status || 'COMPLETED'
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Transactions API Error:", error);
        return NextResponse.json({ error: "Erreur chargement transactions" }, { status: 500 });
    }
}
