import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Activation des CORS pour le frontend Next.js 15
  app.enableCors();
  await app.listen(3001); // Port API différent du Frontend (3000)
}
bootstrap();
