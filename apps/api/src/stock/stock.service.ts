import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../frameworks/data-services/prisma/prisma.service";

interface SaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  /**
   * Traite une vente avec une transaction ACID complète via Prisma.
   * Utilise l'algorithme FEFO (First Expired, First Out) pour déstocker les lots.
   */
  async processSale(
    items: SaleItemDto[],
    userId: string,
    paymentMethod: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Créer la transaction parente d'abord
      const transaction = await tx.transaction.create({
        data: {
          amount: 0, // Sera mis à jour à la fin
          type: "SALE",
          paymentMethod: paymentMethod,
          userId: userId,
          status: "COMPLETED",
        },
      });

      let totalTransactionAmount = 0;
      const results = [];

      for (const item of items) {
        const batches = await tx.batch.findMany({
          where: {
            productId: item.productId,
            quantity: { gt: 0 },
          },
          orderBy: {
            expiryDate: "asc",
          },
        });

        let remainingQtyToDeduct = item.quantity;

        for (const batch of batches) {
          if (remainingQtyToDeduct <= 0) break;

          const qtyTakenFromBatch = Math.min(
            batch.quantity,
            remainingQtyToDeduct,
          );

          await tx.batch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: qtyTakenFromBatch } },
          });

          const movement = await tx.stockMovement.create({
            data: {
              type: "OUT",
              quantity: -qtyTakenFromBatch,
              reason: "SALE_POS",
              userId: userId,
              productId: item.productId,
              batchId: batch.id,
              transactionId: transaction.id, // Lien correct
            },
          });

          totalTransactionAmount += item.unitPrice * qtyTakenFromBatch;
          remainingQtyToDeduct -= qtyTakenFromBatch;

          results.push({
            movementId: movement.id,
            batchId: batch.id,
            qty: qtyTakenFromBatch,
          });
        }

        if (remainingQtyToDeduct > 0) {
          throw new BadRequestException(
            `Stock insuffisant pour le produit ${item.productId}.`,
          );
        }
      }

      // 2. Mettre à jour le montant total de la transaction
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { amount: totalTransactionAmount },
      });

      return { transactionId: transaction.id, results };
    });
  }

  /**
   * Calcul du Stock Virtuel (Disponible)
   * Formule : Physique + Commande - Réservé
   */
  async getVirtualStock(productId: string) {
    const physicalStock = await this.prisma.batch.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });

    return physicalStock._sum.quantity || 0;
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
        },
      },
    });
  }
}
