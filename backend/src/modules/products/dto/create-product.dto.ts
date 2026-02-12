import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Mouse' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'WM-001' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ example: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryCount?: number;
}
