export class CreateMovementDto {
  productId: string;
  batchId: string;
  type: string; // IN, OUT etc..
  quantity: number;
  reason?: string;
  userId: string;
}

export class CreateTransactionDto {
  amount: number;
  type: string; // SALE, PURCHASE
  paymentMethod: string;
  movementId: string;
}
