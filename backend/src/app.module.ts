import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import type { IncomingMessage } from 'http';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { ProductsModule } from '@modules/products/products.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV', 'development') === 'production';
        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true },
                },
            autoLogging: true,
            quietReqLogger: true,
            genReqId: (req: IncomingMessage) =>
              req.headers['x-request-id']?.toString() || crypto.randomUUID(),
            redact: ['req.headers.authorization'],
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'order_management'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV', 'development') !== 'production',
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsRun: config.get<string>('NODE_ENV', 'development') === 'production',
      }),
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
