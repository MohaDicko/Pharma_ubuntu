import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log("🌱 Début du Seed Global...");

    // 1. Nettoyage
    await prisma.stockMovement.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.batch.deleteMany({});
    await prisma.product.deleteMany({});

    // 2. Produits de test
    const products = [
        { name: "Doliprane 1000mg", dci: "Paracétamol", category: "Antalgique", minThreshold: 50, price: 300 },
        { name: "Amoxicilline 500mg", dci: "Amoxicilline", category: "Antibiotique", minThreshold: 20, price: 1500 },
        { name: "Spasfon Lyoc", dci: "Phloroglucinol", category: "Antispasmodique", minThreshold: 10, price: 2800 },
        { name: "Vitamine C UPSA", dci: "Acide Ascorbique", category: "Complément", minThreshold: 15, price: 1200 },
    ];

    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) throw new Error("Admin not found. Run seed-admin first.");

    for (const p of products) {
        const product = await prisma.product.create({
            data: {
                name: p.name,
                dci: p.dci,
                category: p.category,
                minThreshold: p.minThreshold,
                sellingPrice: p.price,
            }
        });

        // 3. Lots pour chaque produit (un récent, un proche de péremption)
        await prisma.batch.createMany({
            data: [
                {
                    productId: product.id,
                    batchNumber: `${p.name.substring(0, 3).toUpperCase()}-24-001`,
                    quantity: 100,
                    costPrice: p.price * 0.6,
                    expiryDate: new Date('2026-12-31'),
                },
                {
                    productId: product.id,
                    batchNumber: `${p.name.substring(0, 3).toUpperCase()}-24-002`,
                    quantity: 5,
                    costPrice: p.price * 0.6,
                    expiryDate: new Date('2024-06-30'), // Déjà périmé ou proche
                }
            ]
        });

        const batches = await prisma.batch.findMany({ where: { productId: product.id } });

        for (const b of batches) {
            await prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    batchId: b.id,
                    userId: user.id,
                    type: 'IN',
                    quantity: b.quantity,
                    reason: 'Stock initial'
                }
            });
        }
    }

    console.log("✅ Seed terminé avec succès !");
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
