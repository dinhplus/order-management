import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';
import { Product } from '@modules/products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column()
  orderId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column()
  productId: string;

  @ApiProperty({ example: 2 })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 29.99, type: 'number' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 59.98, type: 'number' })
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
