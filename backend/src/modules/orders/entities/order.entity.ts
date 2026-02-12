import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  VersionColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'ORD-20260211-ABC123' })
  @Column({ unique: true })
  orderNumber: string;

  @ApiProperty({
    example: 'client-generated-uuid',
    description: 'Client-provided key to prevent duplicate order creation',
    required: false,
  })
  @Column({ type: 'varchar', unique: true, nullable: true })
  idempotencyKey: string | null;

  @ApiProperty({ example: 'John Doe' })
  @Index()
  @Column()
  customerRef: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  @Index()
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({ example: 59.98, type: 'number' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @ApiProperty({ type: () => [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ example: 1, description: 'Version number for optimistic locking' })
  @VersionColumn({ default: 1 })
  version: number;
}
