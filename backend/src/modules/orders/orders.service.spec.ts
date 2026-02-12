import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { type OrderItem } from './entities/order-item.entity';
import { type Product } from '@modules/products/entities/product.entity';
import { OrderStatus } from './enums/order-status.enum';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { ProductStatus } from '@modules/products/enums/product-status.enum';

type MockRepository = Partial<Record<string, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  remove: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: MockRepository;

  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Mouse',
    sku: 'MS-001',
    price: 29.99,
    status: ProductStatus.ACTIVE,
    inventoryCount: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const mockOrder: Order = {
    id: 'order-1',
    orderNumber: 'ORD-123',
    idempotencyKey: null,
    customerRef: 'CUST-001',
    status: OrderStatus.PENDING,
    totalAmount: 59.98,
    items: [
      {
        id: 'item-1',
        orderId: 'order-1',
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 29.99,
        subtotal: 59.98,
        product: mockProduct,
      } as OrderItem,
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    ordersRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: ordersRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('findOne', () => {
    it('should return an order', async () => {
      ordersRepository.findOne!.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-1');
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException', async () => {
      ordersRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      ordersRepository.findAndCount!.mockResolvedValue([[mockOrder], 1]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        get skip() {
          return 0;
        },
        get take() {
          return 10;
        },
      });

      expect(result.data).toEqual([mockOrder]);
      expect(result.total).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('should transition PENDING → CONFIRMED and deduct inventory', async () => {
      ordersRepository.findOne!.mockResolvedValue({ ...mockOrder });
      mockQueryRunner.manager.find.mockResolvedValue([{ ...mockProduct }]);
      mockQueryRunner.manager.save.mockImplementation(async (_: any, entity: any) => entity);

      await service.updateStatus(
        'order-1',
        { status: OrderStatus.CONFIRMED, version: 1 },
        UserRole.MANAGER,
      );

      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should reject invalid transition', async () => {
      const deliveredOrder = { ...mockOrder, status: OrderStatus.DELIVERED };
      ordersRepository.findOne!.mockResolvedValue(deliveredOrder);

      await expect(
        service.updateStatus(
          'order-1',
          { status: OrderStatus.SHIPPED, version: 1 },
          UserRole.MANAGER,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject cancellation by non-manager', async () => {
      ordersRepository.findOne!.mockResolvedValue({ ...mockOrder });

      await expect(
        service.updateStatus(
          'order-1',
          { status: OrderStatus.CANCELLED, version: 1 },
          UserRole.WAREHOUSE_STAFF,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow manager to cancel and restore inventory for confirmed orders', async () => {
      const confirmedOrder = { ...mockOrder, status: OrderStatus.CONFIRMED };
      ordersRepository.findOne!.mockResolvedValue(confirmedOrder);
      mockQueryRunner.manager.find.mockResolvedValue([
        {
          ...mockProduct,
          inventoryCount: 98,
        },
      ]);
      mockQueryRunner.manager.save.mockImplementation(async (_: any, entity: any) => entity);

      await service.updateStatus(
        'order-1',
        { status: OrderStatus.CANCELLED, version: 1 },
        UserRole.MANAGER,
      );

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException on version mismatch', async () => {
      ordersRepository.findOne!.mockResolvedValue({ ...mockOrder, version: 2 });

      await expect(
        service.updateStatus(
          'order-1',
          { status: OrderStatus.CONFIRMED, version: 1 },
          UserRole.MANAGER,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update pending order', async () => {
      ordersRepository.findOne!.mockResolvedValue({ ...mockOrder });
      ordersRepository.save!.mockResolvedValue({
        ...mockOrder,
        customerRef: 'NEW-REF',
      });

      await service.update('order-1', {
        customerRef: 'NEW-REF',
        version: 1,
      });
      expect(ordersRepository.save).toHaveBeenCalled();
    });

    it('should reject updating non-pending order', async () => {
      const shipped = { ...mockOrder, status: OrderStatus.SHIPPED };
      ordersRepository.findOne!.mockResolvedValue(shipped);

      await expect(
        service.update('order-1', { customerRef: 'NEW-REF', version: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      ordersRepository.findOne!.mockResolvedValue({ ...mockOrder, version: 2 });

      await expect(
        service.update('order-1', { customerRef: 'NEW-REF', version: 1 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a pending order', async () => {
      ordersRepository.findOne!.mockResolvedValue({ ...mockOrder });
      ordersRepository.remove!.mockResolvedValue(mockOrder);

      await expect(service.remove('order-1')).resolves.not.toThrow();
    });

    it('should delete a cancelled order', async () => {
      const cancelled = { ...mockOrder, status: OrderStatus.CANCELLED };
      ordersRepository.findOne!.mockResolvedValue(cancelled);
      ordersRepository.remove!.mockResolvedValue(cancelled);

      await expect(service.remove('order-1')).resolves.not.toThrow();
    });

    it('should reject deleting a confirmed order', async () => {
      const confirmed = { ...mockOrder, status: OrderStatus.CONFIRMED };
      ordersRepository.findOne!.mockResolvedValue(confirmed);

      await expect(service.remove('order-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject deleting a shipped order', async () => {
      const shipped = { ...mockOrder, status: OrderStatus.SHIPPED };
      ordersRepository.findOne!.mockResolvedValue(shipped);

      await expect(service.remove('order-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject deleting a delivered order', async () => {
      const delivered = { ...mockOrder, status: OrderStatus.DELIVERED };
      ordersRepository.findOne!.mockResolvedValue(delivered);

      await expect(service.remove('order-1')).rejects.toThrow(BadRequestException);
    });
  });
});
