import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { ORDER_REPOSITORY } from '../order-repository.adapter';
import { TypeOrmOrderRepository } from './typeorm-order.repository';
import { RedisOrderRepository } from './redis-order.repository';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Module({})
export class PersistenceModule {
  static register(): DynamicModule {
    const kind = process.env.DATABASE_KIND ?? 'postgres';

    if (kind === 'redis') {
      return {
        module: PersistenceModule,
        global: true,
        providers: [
          {
            provide: REDIS_CLIENT,
            useFactory: () =>
              new Redis({
                host: process.env.DATABASE_HOST ?? 'localhost',
                port: parseInt(process.env.DATABASE_PORT ?? '6379', 10),
                password: process.env.DATABASE_PASSWORD || undefined,
              }),
          },
          {
            provide: ORDER_REPOSITORY,
            inject: [REDIS_CLIENT],
            useFactory: (redis: Redis) => new RedisOrderRepository(redis),
          },
        ],
        exports: [ORDER_REPOSITORY],
      };
    }

    return {
      module: PersistenceModule,
      global: true,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
          username: process.env.DATABASE_USER || 'orders',
          password: process.env.DATABASE_PASSWORD || 'orders',
          database: process.env.DATABASE_NAME || 'orders',
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Order, OrderItem]),
      ],
      providers: [
        { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
      ],
      exports: [ORDER_REPOSITORY],
    };
  }
}
