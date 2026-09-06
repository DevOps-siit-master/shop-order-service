import { Order, OrderStatus } from './entities/order.entity';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findAll(): Promise<Order[]>;
  findOne(id: string): Promise<Order | null>;
  updateStatus(
    id: string,
    status: OrderStatus,
    txHash?: string,
  ): Promise<Order | null>;
  ping(): Promise<void>;
  findByTxHash(txHash: string): Promise<Order | null>;
}
