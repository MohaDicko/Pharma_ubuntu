import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        const formatted = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: (user as any).status,
            lastLogin: user.transactions.length > 0
                ? user.transactions[0].createdAt.toISOString()
                : 'Jamais'
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Users GET API Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role
            }
        });

        return NextResponse.json({ success: true, userId: newUser.id });
    } catch (error) {
        console.error("Users POST API Error:", error);
        return NextResponse.json({ error: "Erreur lors de la création de l'utilisateur" }, { status: 500 });
    }
}
