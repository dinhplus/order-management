import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { seed } from '@database/seeds/seed';
import { DataSource } from 'typeorm';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const allowedOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:*');
  app.enableCors({
    origin: allowedOrigins.split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Inventory & Order Management API')
    .setDescription('REST API for managing inventory and orders')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const dataSource = app.get(DataSource);
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'production') {
    await seed(dataSource);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
