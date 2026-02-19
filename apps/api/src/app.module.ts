import { Module } from "@nestjs/common";
import { StockModule } from "./stock/stock.module";
import { PrismaService } from "./frameworks/data-services/prisma/prisma.service";

@Module({
  imports: [StockModule],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
