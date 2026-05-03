import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const negativeBatches = await prisma.batch.findMany({
    where: { quantity: { lt: 0 } },
    include: { product: true }
  });
  
  if (negativeBatches.length > 0) {
    console.log("ANOMALIE: Des lots ont une quantité négative !");
    negativeBatches.forEach(b => {
      console.log(`- Produit: ${b.product.name}, Lot: ${b.batchNumber}, Quantité: ${b.quantity}`);
    });
  } else {
    console.log("Aucune quantité négative détectée dans les lots.");
  }

  // Vérifier aussi la cohérence Stock total vs Somme des mouvements
  const products = await prisma.product.findMany({
    include: {
      batches: true,
      movements: true
    }
  });

  products.forEach(p => {
    const sumBatches = p.batches.reduce((acc, b) => acc + b.quantity, 0);
    const sumMovements = p.movements.reduce((acc, m) => acc + m.quantity, 0);
    if (sumBatches !== sumMovements) {
      console.log(`INCOHÉRENCE: Produit ${p.name}`);
      console.log(`  Somme des lots: ${sumBatches}`);
      console.log(`  Somme des mouvements: ${sumMovements}`);
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
