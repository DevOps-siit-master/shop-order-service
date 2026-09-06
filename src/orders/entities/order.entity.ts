import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, Index } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
}

@Index('uq_order_tx_hash', ['txHash'], { unique: true, where: '"txHash" IS NOT NULL' })
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status!: OrderStatus;

  @Column('decimal', { precision: 18, scale: 6 })
    total!: string;

  @Column({ nullable: true })
    txHash!: string;

  @OneToMany(() => OrderItem, (item) => item.order, {
        cascade: true,
        eager: true,
    })
    items!: OrderItem[];

  @CreateDateColumn()
    createdAt!: Date;
}