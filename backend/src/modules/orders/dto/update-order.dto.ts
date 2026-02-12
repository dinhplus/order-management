import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'CUST-002' })
  @IsOptional()
  @IsString()
  customerRef?: string;

  @ApiProperty({
    example: 1,
    description: 'Current version of the order for optimistic locking',
  })
  @IsInt()
  @Min(1)
  version: number;
}
