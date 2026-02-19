"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const stock_controller_1 = require("./stock.controller");
const stock_service_1 = require("./stock.service");
describe("StockController", () => {
    let controller;
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [stock_controller_1.StockController],
            providers: [
                {
                    provide: stock_service_1.StockService,
                    useValue: {
                        findAll: jest.fn().mockResolvedValue([]),
                        processSale: jest.fn().mockResolvedValue({ transactionId: "123" }),
                    },
                },
            ],
        }).compile();
        controller = module.get(stock_controller_1.StockController);
        service = module.get(stock_service_1.StockService);
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
//# sourceMappingURL=stock.controller.spec.js.map