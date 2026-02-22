import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGlobal() {
    console.log("🧪 Lancement du Test Global d'Intégrité (Backend/DB)");
    console.log("--------------------------------------------------");

    // 1. Check Users
    const userCount = await prisma.user.count();
    console.log(`👤 Utilisateurs en base : ${userCount}`);
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    console.log(`✅ Admin trouvé : ${admin ? admin.email : '❌ NON'}`);

    // 2. Check Products
    const productCount = await prisma.product.count();
    console.log(`📦 Produits en catalogue : ${productCount}`);

    // 3. Check Batches (FEFO Logic)
    const activeBatches = await prisma.batch.findMany({
        where: { quantity: { gt: 0 } },
        include: { product: true },
        orderBy: { expiryDate: 'asc' },
        take: 5
    });
    console.log(`⏳ Lots actifs trouvés : ${activeBatches.length}`);
    activeBatches.forEach(b => {
        console.log(`   - [${b.expiryDate.toISOString().split('T')[0]}] ${b.product.name} (Lot: ${b.batchNumber}, Qté: ${b.quantity})`);
    });

    // 4. Check Movements
    const movementCount = await prisma.stockMovement.count();
    console.log(`🔄 Mouvements de stock enregistrés : ${movementCount}`);

    // 5. Check Sustainability
    if (userCount > 0 && productCount > 0 && activeBatches.length > 0) {
        console.log("\n🚀 TEST RÉUSSI : La base de données est saine et peuplée.");
    } else {
        console.log("\n⚠️ ATTENTION : Certaines données manquent. Un seed pourrait être nécessaire.");
    }
}

testGlobal()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
