import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    example: 1,
    description: 'Current version of the product for optimistic locking',
  })
  @IsInt()
  @Min(1)
  version: number;
}
