import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './orders/orders.module';
import { HealthModule } from './health/health.module';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsMiddleware } from './metrics/metrics.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT?? '5432', 10),
      username: process.env.POSTGRES_USER || 'orders',
      password: process.env.POSTGRES_PASSWORD || 'orders',
      database: process.env.POSTGRES_DB || 'orders',
      autoLoadEntities: true,
      synchronize: true,
    }),
    OrdersModule,
    HealthModule,
  ],
  controllers: [AppController, MetricsController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware)
      .exclude({ path: 'metrics', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
