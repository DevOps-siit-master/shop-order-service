import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column()
    productId!: string;

  @Column()
    name!: string;

  @Column('decimal', { precision: 18, scale: 6 })
    price!: string;

  @Column('int')
    quantity!: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    order!: Order;
}