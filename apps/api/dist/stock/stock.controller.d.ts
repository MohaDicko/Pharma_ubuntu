import { StockService } from "./stock.service";
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
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
    processSale(saleData: any): Promise<{
        success: boolean;
        transactionId: any;
        details: {
            transactionId: string;
            results: any[];
        };
    }>;
    getVirtualStock(productId: string): Promise<number>;
}
