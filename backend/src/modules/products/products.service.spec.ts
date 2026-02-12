import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { ProductStatus } from './enums/product-status.enum';

type MockRepository = Partial<Record<string, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: MockRepository;
  let orderItemsRepository: MockRepository;

  const mockProduct: Product = {
    id: 'uuid-1',
    name: 'Wireless Mouse',
    sku: 'WM-001',
    price: 29.99,
    status: ProductStatus.ACTIVE,
    inventoryCount: 150,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  beforeEach(async () => {
    repository = createMockRepository();
    orderItemsRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repository },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemsRepository },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('should create a product', async () => {
      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockReturnValue(mockProduct);
      repository.save!.mockResolvedValue(mockProduct);

      const result = await service.create({
        name: 'Wireless Mouse',
        sku: 'WM-001',
        price: 29.99,
      });

      expect(result).toEqual(mockProduct);
    });

    it('should throw ConflictException for duplicate SKU', async () => {
      repository.findOne!.mockResolvedValue(mockProduct);

      await expect(service.create({ name: 'Test', sku: 'WM-001', price: 10 })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      repository.findAndCount!.mockResolvedValue([[mockProduct], 1]);

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

      expect(result.data).toEqual([mockProduct]);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      repository.findOne!.mockResolvedValue(mockProduct);

      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      const updated = { ...mockProduct, name: 'Updated Mouse' };
      repository.findOne!.mockResolvedValue({ ...mockProduct });
      repository.save!.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { name: 'Updated Mouse', version: 1 });
      expect(result.name).toBe('Updated Mouse');
    });

    it('should throw ConflictException on version mismatch', async () => {
      repository.findOne!.mockResolvedValue({ ...mockProduct, version: 2 });

      await expect(service.update('uuid-1', { name: 'Updated Mouse', version: 1 })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove product with no order references', async () => {
      repository.findOne!.mockResolvedValue(mockProduct);
      orderItemsRepository.count!.mockResolvedValue(0);
      repository.remove!.mockResolvedValue(mockProduct);

      await expect(service.remove('uuid-1')).resolves.not.toThrow();
    });

    it('should throw ConflictException when product has order references', async () => {
      repository.findOne!.mockResolvedValue(mockProduct);
      orderItemsRepository.count!.mockResolvedValue(3);

      await expect(service.remove('uuid-1')).rejects.toThrow(ConflictException);
    });
  });
});
