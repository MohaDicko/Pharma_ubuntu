import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBulkSale() {
    console.log("🧪 Test de Validation des Ventes Groupées");
    console.log("----------------------------------------");

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
        console.error("❌ Erreur : Aucun administrateur trouvé. Faites un seed d'abord.");
        return;
    }

    const products = await prisma.product.findMany({
        take: 3,
        include: { batches: { where: { quantity: { gt: 0 } } } }
    });

    if (products.length < 2) {
        console.error("❌ Erreur : Pas assez de produits avec du stock pour tester.");
        return;
    }

    console.log(`📦 Simulation d'une vente de ${products.length} articles différents...`);

    const items = products.map(p => ({
        productId: p.id,
        quantity: 2
    }));

    // Simule la logique du backend optimisé
    try {
        const result = await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const transaction = await tx.transaction.create({
                data: {
                    type: 'SALE',
                    amount: 0,
                    paymentMethod: 'CASH',
                    userId: admin.id
                }
            });

            const productIds = items.map(i => i.productId);
            const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } });
            const productMap = new Map(dbProducts.map(p => [p.id, p]));

            const allActiveBatches = await tx.batch.findMany({
                where: { productId: { in: productIds }, quantity: { gt: 0 }, expiryDate: { gt: new Date() } },
                orderBy: { expiryDate: 'asc' }
            });
            const memoryBatches = allActiveBatches.map(b => ({ ...b }));
            const stockMovementsData: any[] = [];

            for (const item of items) {
                const product = productMap.get(item.productId);
                if (!product) throw new Error("Produit introuvable");

                const batches = memoryBatches.filter(b => b.productId === item.productId);
                let remaining = item.quantity;

                for (const batch of batches) {
                    if (remaining <= 0) break;
                    const deduct = Math.min(batch.quantity, remaining);
                    
                    const updated = await tx.batch.updateMany({
                        where: { id: batch.id, quantity: { gte: deduct } },
                        data: { quantity: { decrement: deduct } }
                    });

                    if (updated.count === 0) throw new Error("Conflit stock");
                    batch.quantity -= deduct;
                    stockMovementsData.push({
                        type: 'OUT',
                        quantity: -deduct,
                        productId: item.productId,
                        batchId: batch.id,
                        userId: admin.id,
                        transactionId: transaction.id,
                        reason: 'Test Bulk Sale'
                    });
                    remaining -= deduct;
                }
                if (remaining > 0) throw new Error("Stock insuffisant");
                totalAmount += item.quantity * Number(product.sellingPrice);
            }

            if (stockMovementsData.length > 0) {
                await tx.stockMovement.createMany({ data: stockMovementsData });
            }

            await tx.transaction.update({
                where: { id: transaction.id },
                data: { amount: totalAmount }
            });

            return transaction;
        }, { timeout: 30000 });

        console.log(`✅ VENTE RÉUSSIE ! Transaction ID: ${result.id}, Montant: ${result.amount} F`);
        
        // Vérification des mouvements
        const movementsCount = await prisma.stockMovement.count({ where: { transactionId: result.id } });
        console.log(`📊 Mouvements de stock créés : ${movementsCount}`);
        
        if (movementsCount >= items.length) {
            console.log("🚀 TEST GLOBAL VALIDÉ : La logique d'insertion groupée fonctionne.");
        }

    } catch (e) {
        console.error("❌ ÉCHEC DU TEST :", e);
    }
}

testBulkSale()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
