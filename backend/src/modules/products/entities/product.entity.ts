import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '../enums/product-status.enum';

@Entity('products')
export class Product {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Wireless Mouse' })
  @Index()
  @Column()
  name: string;

  @ApiProperty({ example: 'WM-001' })
  @Column({ unique: true })
  sku: string;

  @ApiProperty({ example: 29.99, type: 'number' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  @Index()
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @ApiProperty({ example: 100 })
  @Column({ type: 'int', default: 0 })
  inventoryCount: number;

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
