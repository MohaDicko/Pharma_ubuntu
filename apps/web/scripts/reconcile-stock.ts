import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function reconcile() {
  console.log("🚀 Démarrage de la réconciliation du stock...");
  
  const products = await prisma.product.findMany({
    include: {
      batches: true,
      movements: true
    }
  });

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const userId = admin?.id || "system";

  for (const p of products) {
    const sumBatches = p.batches.reduce((acc, b) => acc + b.quantity, 0);
    const sumMovements = p.movements.reduce((acc, m) => acc + m.quantity, 0);
    
    if (sumBatches !== sumMovements) {
      const diff = sumBatches - sumMovements;
      console.log(`⚖️ Réconciliation pour ${p.name}: Différence de ${diff}`);
      
      // Trouver le lot le plus ancien pour y attacher le mouvement de régularisation
      // ou créer un mouvement global si pas de lot spécifique (mais ici on a des lots)
      const targetBatch = p.batches[0]; 
      
      if (targetBatch) {
        await prisma.stockMovement.create({
          data: {
            type: diff > 0 ? 'IN' : 'OUT',
            quantity: diff,
            reason: "Réconciliation Automatique (Correction Données Historiques)",
            productId: p.id,
            batchId: targetBatch.id,
            userId: userId
          }
        });
        console.log(`✅ Création d'un mouvement de ${diff > 0 ? '+' : ''}${diff} pour ${p.name}`);
      } else {
        console.log(`⚠️ Impossible de réconcilier ${p.name} : aucun lot trouvé.`);
      }
    }
  }
  
  console.log("🏁 Réconciliation terminée.");
}

reconcile().catch(console.error).finally(() => prisma.$disconnect());
