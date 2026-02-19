export declare class CreateMovementDto {
    productId: string;
    batchId: string;
    type: string;
    quantity: number;
    reason?: string;
    userId: string;
}
export declare class CreateTransactionDto {
    amount: number;
    type: string;
    paymentMethod: string;
    movementId: string;
}
