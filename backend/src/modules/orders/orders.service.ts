import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, ILike, FindOptionsWhere } from 'typeorm';
import { randomUUID } from 'crypto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '@modules/products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderStatus } from './enums/order-status.enum';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { PaginatedResult } from '@common/dto/pagination.dto';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderNumber = `ORD-${randomUUID().split('-')[0].toUpperCase()}`;

      let totalAmount = 0;
      const productIds = createOrderDto.items.map((item) => item.productId);
      const products = await queryRunner.manager.find(Product, {
        where: { id: In(productIds) },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      const missingIds = productIds.filter((id) => !productMap.has(id));
      if (missingIds.length > 0) {
        throw new NotFoundException(`Products not found: ${missingIds.join(', ')}`);
      }

      const items: Partial<OrderItem>[] = [];

      for (const itemDto of createOrderDto.items) {
        const product = productMap.get(itemDto.productId) as Product;
        const unitPrice = Number(product.price.toString());
        const subtotal = unitPrice * itemDto.quantity;
        totalAmount += subtotal;

        items.push({
          productId: product.id,
          quantity: itemDto.quantity,
          unitPrice,
          subtotal,
        });
      }

      const order = queryRunner.manager.create(Order, {
        orderNumber,
        customerRef: createOrderDto.customerRef,
        idempotencyKey: createOrderDto.idempotencyKey ?? null,
        status: OrderStatus.PENDING,
        totalAmount,
        items: items as OrderItem[],
      });

      const savedOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      return await this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        createOrderDto.idempotencyKey &&
        error instanceof Object &&
        'code' in error &&
        (error as Record<string, unknown>).code === '23505'
      ) {
        const existing = await this.ordersRepository.findOne({
          where: { idempotencyKey: createOrderDto.idempotencyKey },
          relations: ['items', 'items.product'],
        });
        if (existing) {
          return existing;
        }
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: QueryOrderDto): Promise<PaginatedResult<Order>> {
    const where: FindOptionsWhere<Order> = {};

    if (query.orderNumber) {
      where.orderNumber = ILike(`%${query.orderNumber}%`);
    }
    if (query.customerRef) {
      where.customerRef = ILike(`%${query.customerRef}%`);
    }
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.ordersRepository.findAndCount({
      where,
      skip: query.skip,
      take: query.take,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be updated');
    }

    if (order.version !== updateOrderDto.version) {
      throw new ConflictException(
        'This order has been modified by another user. Please refresh and try again',
      );
    }

    const { version: _version, ...updateData } = updateOrderDto;
    void _version;
    Object.assign(order, updateData);
    await this.ordersRepository.save(order);
    return this.findOne(id);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userRole: UserRole): Promise<Order> {
    const order = await this.findOne(id);
    const { status: newStatus } = dto;

    if (order.version !== dto.version) {
      throw new ConflictException(
        'This order has been modified by another user. Please refresh and try again',
      );
    }

    const allowedTransitions = VALID_TRANSITIONS[order.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from "${order.status}" to "${newStatus}"`);
    }

    if (newStatus === OrderStatus.CANCELLED && userRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Only managers can cancel orders');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (
        newStatus === OrderStatus.CONFIRMED ||
        (newStatus === OrderStatus.CANCELLED && order.status === OrderStatus.CONFIRMED)
      ) {
        const productIds = order.items.map((item) => item.productId);
        const products = await queryRunner.manager.find(Product, {
          where: { id: In(productIds) },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const item of order.items) {
          const product = productMap.get(item.productId);

          if (newStatus === OrderStatus.CONFIRMED) {
            if (!product || product.inventoryCount < item.quantity) {
              throw new BadRequestException(
                `Insufficient inventory for product "${product?.name || item.productId}"`,
              );
            }
            product.inventoryCount -= item.quantity;
          } else if (product) {
            product.inventoryCount += item.quantity;
          }
        }

        await queryRunner.manager.save(Product, products);
      }

      order.status = newStatus;
      await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();

      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    const deletableStatuses = [OrderStatus.PENDING, OrderStatus.CANCELLED];

    if (!deletableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot delete order with status "${order.status}". Only pending or cancelled orders can be deleted`,
      );
    }

    await this.ordersRepository.remove(order);
  }
}
