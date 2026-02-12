import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}
