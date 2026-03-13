import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';

const SaleSchema = z.object({
    paymentMethod: z.enum(['CASH', 'CARD', 'INSURANCE', 'MOBILE_MONEY']).optional().default('CASH'),
    insuranceId: z.string().uuid().optional().nullable(),
    insurancePart: z.coerce.number().nonnegative().optional(),
    patientPart: z.coerce.number().nonnegative().optional(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
        sellingPrice: z.coerce.number().nonnegative().optional(), // Toléré côté frontend mais ignoré côté backend
    })).min(1, "Panier vide")
});

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // RBAC: Ventes autorisées pour CASHIER, PHARMACIST, ADMIN
        const userRole = session.user.role;
        const allowedRoles = ['CASHIER', 'PHARMACIST', 'ADMIN'];

        if (!userRole || !allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: "Accès refusé: Rôle insuffisant" }, { status: 403 });
        }

        const userId = session.user.id;

        // Rate Limiting
        const isAllowed = await rateLimit(`sales-${userId}`);
        if (!isAllowed) {
            return NextResponse.json({ error: "Trop de requêtes, veuillez patienter." }, { status: 429 });
        }

        const body = await req.json();

        // Validation Zod
        const validation = SaleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Données invalides", details: validation.error.format() }, { status: 400 });
        }

        const { items, paymentMethod, insuranceId, insurancePart, patientPart } = validation.data;

        const result = await prisma.$transaction(async (tx: any) => {
            let totalAmount = 0;

            // 1. Création de la transaction financière
            const transaction = await tx.transaction.create({
                data: {
                    type: 'SALE',
                    amount: 0,
                    paymentMethod: paymentMethod,
                    status: 'COMPLETED',
                    userId: userId,
                    insuranceId: insuranceId,
                    insurancePart: insurancePart || 0,
                    patientPart: patientPart || 0
                }
            });

            // 2. Optimisation : Charger tous les produits concernés d'un coup
            const productIds = items.map(i => i.productId);
            const dbProducts = await tx.product.findMany({
                where: { id: { in: productIds } }
            });
            const productMap = new Map<string, any>(dbProducts.map((p: any) => [p.id, p]));

            // 3. Optimisation : Charger TOUS les lots actifs pour ces produits d'un coup
            const allActiveBatches = await tx.batch.findMany({
                where: {
                    productId: { in: productIds },
                    quantity: { gt: 0 },
                    expiryDate: { gt: new Date() }
                },
                orderBy: { expiryDate: 'asc' }
            });

            // On utilise une version modifiable des lots pour la gestion en mémoire
            const memoryBatches = allActiveBatches.map((b: any) => ({ ...b }));
            const stockMovementsData: any[] = [];

            for (const item of items) {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new Error(`Produit introuvable: ${item.productId}`);
                }

                const batches = memoryBatches.filter((b: any) => b.productId === item.productId);
                let remainingQtyToDeduct = item.quantity;

                for (const batch of batches) {
                    if (remainingQtyToDeduct <= 0) break;
                    if (batch.quantity <= 0) continue;

                    const deduct = Math.min(batch.quantity, remainingQtyToDeduct);
                    
                    const updatedBatch = await tx.batch.updateMany({
                        where: { id: batch.id, quantity: { gte: deduct } },
                        data: { quantity: { decrement: deduct } }
                    });

                    if (updatedBatch.count === 0) {
                        throw new Error(`Conflit de stock sur le lot ${batch.id} (${product.name}).`);
                    }

                    batch.quantity -= deduct;

                    // On stocke les données du mouvement au lieu de faire un create immédiat
                    stockMovementsData.push({
                        type: 'OUT',
                        quantity: -deduct,
                        reason: 'Vente POS',
                        productId: item.productId,
                        batchId: batch.id,
                        userId: userId,
                        transactionId: transaction.id
                    });

                    remainingQtyToDeduct -= deduct;
                }

                if (remainingQtyToDeduct > 0) {
                    throw new Error(`Stock insuffisant pour le produit: ${product.name}`);
                }

                totalAmount += item.quantity * Number(product.sellingPrice);
            }

            // 4. Création groupée des mouvements de stock (Optimisation majeure)
            if (stockMovementsData.length > 0) {
                await tx.stockMovement.createMany({
                    data: stockMovementsData
                });
            }

            // 5. Mise à jour finale transaction
            await tx.transaction.update({
                where: { id: transaction.id },
                data: { amount: totalAmount }
            });

            // 6. Log d'audit
            await createAuditLog(userId, 'CREATE_SALE', {
                transactionId: transaction.id,
                amount: totalAmount,
                itemCount: items.length
            });

            return { transaction };
        }, {
            maxWait: 5000,
            timeout: 30000 // 30s pour être très large sur les grosses transactions
        });

        return NextResponse.json({
            success: true,
            transactionId: result.transaction.id
        });

    } catch (error) {
        console.error("Erreur Vente:", error);
        return NextResponse.json({ error: (error as Error).message || "Erreur interne" }, { status: 500 });
    }
}
