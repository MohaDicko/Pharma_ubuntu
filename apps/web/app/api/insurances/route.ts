import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const InsuranceSchema = z.object({
    name: z.string().min(2, 'Nom requis'),
    code: z.string().optional(),
    percentage: z.number().int().min(0).max(100),
});

// ── GET : Liste toutes les assurances ────────────────────────────────────────
export async function GET() {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const insurances = await prisma.insurance.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                code: true,
                percentage: true,
                status: true,
                _count: {
                    select: { transactions: true }
                }
            }
        });

        return NextResponse.json(insurances);
    } catch (error) {
        console.error('Insurances GET Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// ── POST : Créer une assurance ───────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès restreint aux administrateurs' }, { status: 403 });
        }

        const body = await req.json();
        const validation = InsuranceSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Données invalides', details: validation.error.format() }, { status: 400 });
        }

        const { name, code, percentage } = validation.data;

        // Check unicité
        const existing = await prisma.insurance.findFirst({ where: { name } });
        if (existing) {
            return NextResponse.json({ error: `Une assurance nommée "${name}" existe déjà` }, { status: 409 });
        }

        const insurance = await prisma.insurance.create({
            data: { name, code: code || null, percentage }
        });

        return NextResponse.json(insurance, { status: 201 });
    } catch (error) {
        console.error('Insurance POST Error:', error);
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }
}
