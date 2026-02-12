import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 'CUST-001' })
  @IsString()
  @IsNotEmpty()
  customerRef: string;

  @ApiPropertyOptional({
    example: 'client-generated-uuid',
    description: 'Client-provided idempotency key to prevent duplicate order creation',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
