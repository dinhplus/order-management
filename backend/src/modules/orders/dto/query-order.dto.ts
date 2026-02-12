import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { OrderStatus } from '../enums/order-status.enum';

export class QueryOrderDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerRef?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
