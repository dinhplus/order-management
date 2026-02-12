import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { Order } from './entities/order.entity';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/users/enums/user-role.enum';
import type { RequestWithUser } from '@common/interfaces/authenticated-request.interface';
import { type PaginatedResult } from '@common/dto/pagination.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new order (Manager only)' })
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders with pagination and filtering' })
  async findAll(@Query() query: QueryOrderDto): Promise<PaginatedResult<Order>> {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Update order details (Manager only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (Cancel requires Manager)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: RequestWithUser,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, dto, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete an order (Manager only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ordersService.remove(id);
  }
}
