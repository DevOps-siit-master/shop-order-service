import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
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
    const order = this.orders.create({
      items, total, status: OrderStatus.PENDING,
    });
    return this.orders.save(order);
  }

  findAll(): Promise<Order[]> {
    return this.orders.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, txHash?: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    if (txHash) order.txHash = txHash;
    return this.orders.save(order);
  }
}


