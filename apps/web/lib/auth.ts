import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = (credentials.email as string).trim();
                const password = credentials.password as string;

                console.log('Tentative de connexion pour:', email);
                const user = await getUser(email);

                if (!user) {
                    console.log('Utilisateur non trouvé:', email);
                    return null;
                }

                if ((user as any).status === 'INACTIF') {
                    console.log('Compte désactivé:', email);
                    return null;
                }

                const passwordsMatch = await bcrypt.compare(password, user.password);
                console.log('Match mot de passe:', passwordsMatch);

                if (passwordsMatch) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                }

                return null;
            },
        }),
    ],
});
