import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Product } from './entities/product.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginatedResult } from '@common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existing = await this.productsRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existing) {
      throw new ConflictException(`Product with SKU "${createProductDto.sku}" already exists`);
    }

    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async findAll(query: QueryProductDto): Promise<PaginatedResult<Product>> {
    const where: FindOptionsWhere<Product> = {};

    if (query.name) {
      where.name = ILike(`%${query.name}%`);
    }
    if (query.sku) {
      where.sku = ILike(`%${query.sku}%`);
    }
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.productsRepository.findAndCount({
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

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (product.version !== updateProductDto.version) {
      throw new ConflictException(
        'This product has been modified by another user. Please refresh and try again',
      );
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existing = await this.productsRepository.findOne({
        where: { sku: updateProductDto.sku },
      });
      if (existing) {
        throw new ConflictException(`Product with SKU "${updateProductDto.sku}" already exists`);
      }
    }

    const { version: _version, ...updateData } = updateProductDto;
    void _version;
    Object.assign(product, updateData);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);

    const orderItemCount = await this.orderItemsRepository.count({
      where: { productId: id },
    });
    if (orderItemCount > 0) {
      throw new ConflictException(
        `Cannot delete product "${product.name}" — it is referenced by ${orderItemCount} order item(s)`,
      );
    }

    await this.productsRepository.remove(product);
  }
}
