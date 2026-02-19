import { Test, TestingModule } from "@nestjs/testing";
import { StockService } from "./stock.service";
import { PrismaService } from "../frameworks/data-services/prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";

describe("StockService", () => {
  let service: StockService;

  const mockPrisma = {
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    transaction: {
      create: jest.fn().mockResolvedValue({ id: "tx-1" }),
      update: jest.fn(),
    },
    batch: {
      findMany: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("processSale", () => {
    it("should throw BadRequestException if stock is insufficient", async () => {
      mockPrisma.batch.findMany.mockResolvedValue([]); // No batches

      const items = [{ productId: "p1", quantity: 10, unitPrice: 100 }];

      await expect(service.processSale(items, "u1", "CASH")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should complete a sale correctly following FEFO", async () => {
      const mockBatches = [
        { id: "b1", quantity: 5, expiryDate: new Date("2025-01-01") },
        { id: "b2", quantity: 10, expiryDate: new Date("2025-02-01") },
      ];

      mockPrisma.batch.findMany.mockResolvedValue(mockBatches);
      mockPrisma.stockMovement.create.mockResolvedValue({ id: "mov-1" });

      const items = [{ productId: "p1", quantity: 7, unitPrice: 100 }];
      const result = await service.processSale(items, "u1", "CASH");

      expect(result.transactionId).toBe("tx-1");
      // Should take 5 from b1 and 2 from b2
      expect(mockPrisma.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "b1" },
        }),
      );
      expect(mockPrisma.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "b2" },
        }),
      );
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { amount: 700 },
        }),
      );
    });
  });
});
