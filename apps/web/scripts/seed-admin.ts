import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (result.error) {
    console.error("❌ Impossible de charger le fichier .env:", result.error);
}

// Ensure Prisma sees the variables
if (process.env.DATABASE_URL) {
    console.log("🔗 DATABASE_URL trouvée.");
}

const prisma = new PrismaClient();

async function main() {
    const adminEmail = "safi@ubuntu.com";
    const adminPass = "Safi_Ubuntu_2026!";
    const adminName = "Safi (Directrice)";

    console.log("🚀 Création du compte admin pour Safi...");

    const hashedPassword = await bcrypt.hash(adminPass, 10);

    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            name: adminName,
            role: "ADMIN"
        },
        create: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            role: "ADMIN"
        }
    });

    console.log("✅ Compte admin créé avec succès !");
    console.log("-----------------------------------");
    console.log(`📧 Email : ${user.email}`);
    console.log(`🔑 Mot de passe : ${adminPass}`);
    console.log("-----------------------------------");
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors du seed :", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
