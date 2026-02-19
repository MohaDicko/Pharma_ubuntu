import { Module } from "@nestjs/common";
import { StockService } from "./stock.service";
import { StockController } from "./stock.controller";
import { PrismaService } from "../frameworks/data-services/prisma/prisma.service";

@Module({
  imports: [],
  controllers: [StockController],
  providers: [StockService, PrismaService],
  exports: [StockService], // Export si d'autres modules ont besoin de stock
})
export class StockModule {}
