import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderRepository } from '../order-repository.adapter';

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  create(order: Order): Promise<Order> {
    return this.orders.save(order);
  }

  findAll(): Promise<Order[]> {
    return this.orders.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<Order | null> {
    return this.orders.findOne({ where: { id } });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    txHash?: string,
  ): Promise<Order | null> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) return null;
    order.status = status;
    if (txHash) order.txHash = txHash;
    return this.orders.save(order);
  }

  async ping(): Promise<void> {
    await this.orders.query('SELECT 1');
  }

  findByTxHash(txHash: string): Promise<Order | null> {
    return this.orders.findOne({ where: { txHash } });
  }
}
