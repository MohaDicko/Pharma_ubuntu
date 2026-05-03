import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
        }

        const products = await prisma.product.findMany({
            include: {
                batches: true,
                movements: true
            }
        });

        const inconsistencies = products.filter(p => {
            const sumBatches = p.batches.reduce((acc, b) => acc + b.quantity, 0);
            const sumMovements = p.movements.reduce((acc, m) => acc + m.quantity, 0);
            return sumBatches !== sumMovements;
        }).map(p => ({
            id: p.id,
            name: p.name,
            batchStock: p.batches.reduce((acc, b) => acc + b.quantity, 0),
            movementStock: p.movements.reduce((acc, m) => acc + m.quantity, 0)
        }));

        return NextResponse.json({
            status: inconsistencies.length === 0 ? 'HEALTHY' : 'UNSTABLE',
            inconsistenciesCount: inconsistencies.length,
            details: inconsistencies
        });
    } catch (error) {
        console.error("Health Check Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
