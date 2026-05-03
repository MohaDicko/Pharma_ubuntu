import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const products = await prisma.product.findMany({
            include: {
                batches: {
                    where: { quantity: { gt: 0 } },
                    orderBy: { expiryDate: 'asc' }
                }
            }
        });

        const inventory = products.map((product: any) => {
            const totalQty = product.batches.reduce((sum: number, b: any) => sum + b.quantity, 0);
            const nearestExpiry = product.batches.length > 0 ? product.batches[0].expiryDate : null;

            return {
                id: product.id,
                name: product.name,
                dci: product.dci,
                category: product.category,
                totalStock: totalQty,
                minThreshold: product.minThreshold,
                sellingPrice: Number(product.sellingPrice),
                nearestExpiry: nearestExpiry,
                status: totalQty <= 0 ? "Rupture" : totalQty <= product.minThreshold ? "Alerte" : "OK"
            };
        });

        return NextResponse.json(inventory);
    } catch (error) {
        console.error("Inventory Fetch Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'PHARMACIST'].includes(session.user.role)) {
            return NextResponse.json({ error: "Accès refusé: Rôle insuffisant" }, { status: 403 });
        }

        const body = await req.json();
        const { batchId, newQuantity, reason } = body;
        const operatorId = session.user.id as string;

        if (!batchId || newQuantity === undefined) {
            return NextResponse.json({ error: "ID du lot et nouvelle quantité requis" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const batch = await tx.batch.findUnique({
                where: { id: batchId },
                include: { product: true }
            });

            if (!batch) throw new Error("Lot introuvable");

            const diff = newQuantity - batch.quantity;
            if (diff === 0) return batch;

            // 1. Mettre à jour le lot
            const updatedBatch = await tx.batch.update({
                where: { id: batchId },
                data: { quantity: newQuantity }
            });

            // 2. Enregistrer le mouvement de stock
            await tx.stockMovement.create({
                data: {
                    type: 'ADJUSTMENT',
                    quantity: diff,
                    reason: reason || "Ajustement manuel d'inventaire",
                    productId: batch.productId,
                    batchId: batchId,
                    userId: operatorId
                }
            });

            // 3. Log d'audit
            await tx.auditLog.create({
                data: {
                    action: 'INVENTORY_ADJUSTMENT',
                    details: {
                        product: batch.product.name,
                        batch: batch.batchNumber,
                        oldQty: batch.quantity,
                        newQty: newQuantity,
                        diff: diff,
                        reason: reason
                    },
                    userId: operatorId
                }
            });

            return updatedBatch;
        });

        return NextResponse.json({ success: true, batch: result });
    } catch (error) {
        console.error("Inventory Adjustment Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
