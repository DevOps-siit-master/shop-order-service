import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderRepository } from '../order-repository.adapter';

const key = (id: string) => `order:${id}`;
const INDEX = 'orders:index'; // zset: member=id, score=createdAt(ms)

@Injectable()
export class RedisOrderRepository implements OrderRepository {
  constructor(private readonly redis: Redis) {}

  private revive(o: any): Order {
    return { ...o, createdAt: new Date(o.createdAt) } as Order;
  }

  async create(order: Order): Promise<Order> {
    const id = randomUUID();
    const createdAt = new Date();
    const stored = {
      ...order,
      id,
      createdAt: createdAt.toISOString(),
      items: order.items.map((it) => ({ ...it, id: randomUUID() })),
    };
    await this.redis
      .multi()
      .set(key(id), JSON.stringify(stored))
      .zadd(INDEX, createdAt.getTime(), id)
      .exec();
    return this.revive(stored);
  }

  async findAll(): Promise<Order[]> {
    const ids = await this.redis.zrevrange(INDEX, 0, -1); // newest first
    if (!ids.length) return [];
    const raw = await this.redis.mget(ids.map(key));
    return raw
      .filter((r): r is string => !!r)
      .map((r) => this.revive(JSON.parse(r)));
  }

  async findOne(id: string): Promise<Order | null> {
    const raw = await this.redis.get(key(id));
    return raw ? this.revive(JSON.parse(raw)) : null;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    txHash?: string,
  ): Promise<Order | null> {
    const raw = await this.redis.get(key(id));
    if (!raw) return null;
    const order = JSON.parse(raw);
    order.status = status;
    if (txHash) order.txHash = txHash;
    await this.redis.set(key(id), JSON.stringify(order));
    return this.revive(order);
  }

  async ping(): Promise<void> {
    await this.redis.ping();
  }
}
