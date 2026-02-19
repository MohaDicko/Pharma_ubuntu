"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../frameworks/data-services/prisma/prisma.service");
let StockService = class StockService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processSale(items, userId, paymentMethod) {
        return await this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    amount: 0,
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
                    if (remainingQtyToDeduct <= 0)
                        break;
                    const qtyTakenFromBatch = Math.min(batch.quantity, remainingQtyToDeduct);
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
                            transactionId: transaction.id,
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
                    throw new common_1.BadRequestException(`Stock insuffisant pour le produit ${item.productId}.`);
                }
            }
            await tx.transaction.update({
                where: { id: transaction.id },
                data: { amount: totalTransactionAmount },
            });
            return { transactionId: transaction.id, results };
        });
    }
    async getVirtualStock(productId) {
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
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockService);
//# sourceMappingURL=stock.service.js.map