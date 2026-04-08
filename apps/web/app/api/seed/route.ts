import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const seedHandler = async (req: Request) => {
    // 🛡️ SÉCURITÉ : Token requis même en Dev
    const token = req.headers.get('x-seed-token');
    if (!process.env.SEED_TOKEN || token !== process.env.SEED_TOKEN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("🧹 Nettoyage de la base de données...");
        // Supprimer toutes les données existantes (Order matters because of FK constraints)
        await prisma.stockMovement.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.auditLog.deleteMany({});
        await prisma.batch.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.user.deleteMany({});

        console.log("👤 Création de l'Administrateur...");

        // Utiliser les variables d'environnement si disponibles, sinon défaut DEV uniquement
        const adminEmail = process.env.ADMIN_EMAIL || "aziz";
        const adminPass = process.env.ADMIN_PASSWORD || "aziz";

        const hashedPassword = await bcrypt.hash(adminPass, 10);

        const adminUser = await prisma.user.create({
            data: {
                name: "Administrateur",
                email: adminEmail,
                password: hashedPassword,
                role: "ADMIN"
            }
        });

        console.log(`✅ Admin créé: ${adminUser.email} (ID: ${adminUser.id})`);

        const catalog = [
            {
                name: "Doliprane 1000mg Cpr",
                dci: "Paracétamol",
                category: "Antalgique",
                sellingPrice: 300,
                costPrice: 185,
                minThreshold: 20,
                batches: [
                    { num: "BATCH-A-001", qty: 100, exp: "2026-12-31" },
                    { num: "BATCH-A-002", qty: 50, exp: "2025-06-30" }
                ]
            },
            {
                name: "Spasfon Lyoc",
                dci: "Phloroglucinol",
                category: "Antispasmodique",
                sellingPrice: 2850,
                costPrice: 1950,
                minThreshold: 10,
                batches: [
                    { num: "SPAS-2024-X", qty: 30, exp: "2027-01-01" }
                ]
            },
            {
                name: "Amoxicilline 500mg",
                dci: "Amoxicilline",
                category: "Antibiotique",
                sellingPrice: 1500,
                costPrice: 900,
                minThreshold: 50,
                batches: [
                    { num: "AMOX-B-99", qty: 200, exp: "2026-05-20" }
                ]
            },
            {
                name: "Vitamine C UPSA",
                dci: "Acide Ascorbique",
                category: "Vitamine",
                sellingPrice: 1200,
                costPrice: 750,
                minThreshold: 15,
                batches: [
                    { num: "VIT-C-22", qty: 60, exp: "2025-11-15" }
                ]
            },
            {
                name: "Sérum Physiologique",
                dci: "Chlorure de Sodium",
                category: "Soins",
                sellingPrice: 1500,
                costPrice: 800,
                minThreshold: 30,
                batches: [
                    { num: "SER-PHY-01", qty: 500, exp: "2028-01-01" }
                ]
            },
        ];

        for (const item of catalog) {
            const product = await prisma.product.create({
                data: {
                    name: item.name,
                    dci: item.dci,
                    category: item.category,
                    minThreshold: item.minThreshold,
                    sellingPrice: item.sellingPrice,
                }
            });

            for (const batchData of item.batches) {
                const batch = await prisma.batch.create({
                    data: {
                        productId: product.id,
                        batchNumber: batchData.num,
                        quantity: batchData.qty,
                        costPrice: item.costPrice,
                        expiryDate: new Date(batchData.exp)
                    }
                });

                await prisma.stockMovement.create({
                    data: {
                        type: "IN",
                        quantity: batchData.qty,
                        reason: "Initial Seed",
                        userId: adminUser.id,
                        productId: product.id,
                        batchId: batch.id
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `${catalog.length} produits insérés. Admin: ${adminUser.email}`
        });

    } catch (error) {
        console.error("Erreur Seed:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
};

// 🛡️ SÉCURITÉ : Désactivé au niveau structurel en Production
// 🛡️ SÉCURITÉ : Désactivé au niveau structurel en Vercel Production (VERCEL_ENV)
// Note: NODE_ENV est 'production' même en Preview sur Vercel, donc on utilise VERCEL_ENV.
export const GET = process.env.VERCEL_ENV === 'production'
    ? async () => new NextResponse(null, { status: 404 })
    : seedHandler;

