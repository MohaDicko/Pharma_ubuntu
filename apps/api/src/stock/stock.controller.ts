import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { StockService } from "./stock.service";

@Controller("stock")
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async findAll() {
    return this.stockService.findAll();
  }

  @Post("sale")
  async processSale(@Body() saleData: any) {
    console.log("Réception demande de vente:", saleData);

    const { items, userId, paymentMethod } = saleData;

    try {
      const result = await this.stockService.processSale(
        items,
        userId,
        paymentMethod,
      );
      return {
        success: true,
        transactionId: result[0]?.movementId, // ID simplifié pour l'exemple
        details: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get("virtual/:productId")
  async getVirtualStock(@Query("productId") productId: string) {
    return this.stockService.getVirtualStock(productId);
  }
}
