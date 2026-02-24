import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const insurances = await prisma.insurance.findMany({
            where: { status: 'ACTIF' },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(insurances);
    } catch (error) {
        console.error("Insurances GET Error:", error);
        return NextResponse.json({ error: "Erreur lors du chargement des assurances" }, { status: 500 });
    }
}
