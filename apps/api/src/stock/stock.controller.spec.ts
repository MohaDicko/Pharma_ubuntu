import { Test, TestingModule } from "@nestjs/testing";
import { StockController } from "./stock.controller";
import { StockService } from "./stock.service";

describe("StockController", () => {
  let controller: StockController;
  let service: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            processSale: jest.fn().mockResolvedValue({ transactionId: "123" }),
          },
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
    service = module.get<StockService>(StockService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAll", async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
    });
  });
});
