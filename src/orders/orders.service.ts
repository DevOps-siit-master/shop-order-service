import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from './order-repository.adapter';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepository,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const items = dto.items.map((i) => {
      const item = new OrderItem();
      item.productId = i.productId;
      item.name = i.name;
      item.price = i.price;
      item.quantity = i.quantity;
      return item;
    });
    const total = items
      .reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
      .toFixed(6);

    const order = new Order();
    order.items = items;
    order.total = total;
    order.status = OrderStatus.PENDING;
    return this.orders.create(order);
  }

  findAll(): Promise<Order[]> {
    return this.orders.findAll();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orders.findOne(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    txHash?: string,
  ): Promise<Order> {
    const order = await this.updateStatus(id, status, txHash);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }
}
