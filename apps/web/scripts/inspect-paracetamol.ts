import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const p = await prisma.product.findFirst({
    where: { name: 'Paracetamol' },
    include: { batches: true, movements: true }
  });
  console.log(JSON.stringify(p, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
