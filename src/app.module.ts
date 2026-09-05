import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from './orders/orders.module';
import { HealthModule } from './health/health.module';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsMiddleware } from './metrics/metrics.middleware';
import { PersistenceModule } from './orders/persistence/persistence.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PersistenceModule.register(),
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
