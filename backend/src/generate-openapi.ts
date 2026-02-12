import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { Product } from '@modules/products/entities/product.entity';
import { Order } from '@modules/orders/entities/order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';

async function generateSpec(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: false,
    // Skip actual module initialization (DB connections, etc.)
    preview: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Inventory & Order Management API')
    .setDescription('REST API for managing inventory and orders')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [Product, Order, OrderItem],
  });

  // __dirname at runtime = backend/dist/src/ → go up 3 levels to project root
  const outputPath = resolve(__dirname, '../../../openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`OpenAPI spec written to ${outputPath}`);

  await app.close();
  process.exit(0);
}

void generateSpec();
