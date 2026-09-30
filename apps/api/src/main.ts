import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // If behind a proxy/load balancer, rate limiting needs the real client IP:
  // app.set("trust proxy", 1);

  app.enableCors({ origin: "http://localhost:5173" }); // your frontend URL

  await app.listen(3000);
}
bootstrap();