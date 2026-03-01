import { PrismaService } from "../frameworks/data-services/prisma/prisma.service";
interface SaleItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
}
export declare class StockService {
    private prisma;
    constructor(prisma: PrismaService);
    processSale(items: SaleItemDto[], userId: string, paymentMethod: string): Promise<{
        transactionId: string;
        results: any[];
    }>;
    getVirtualStock(productId: string): Promise<number>;
    findAll(): Promise<({
        batches: {
            id: string;
            createdAt: Date;
            quantity: number;
            costPrice: import("@prisma/client/runtime/library").Decimal;
            updatedAt: Date;
            batchNumber: string;
            expiryDate: Date;
            productId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.Status;
        createdAt: Date;
        name: string;
        dci: string;
        category: string;
        minThreshold: number;
        sellingPrice: import("@prisma/client/runtime/library").Decimal;
        codeMatrix: string | null;
        barCode: string | null;
        updatedAt: Date;
    })[]>;
}
export {};
