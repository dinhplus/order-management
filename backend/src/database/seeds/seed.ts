import { type DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '@modules/users/entities/user.entity';
import { UserRole } from '@modules/users/enums/user-role.enum';
import { Product } from '@modules/products/entities/product.entity';
import { ProductStatus } from '@modules/products/enums/product-status.enum';

export async function seed(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const productRepo = dataSource.getRepository(Product);

  const existingUsers = await userRepo.count();
  if (existingUsers === 0) {
    const salt = await bcrypt.genSalt(10);

    const users = userRepo.create([
      {
        username: 'manager',
        password: await bcrypt.hash('password123', salt),
        role: UserRole.MANAGER,
      },
      {
        username: 'staff',
        password: await bcrypt.hash('password123', salt),
        role: UserRole.WAREHOUSE_STAFF,
      },
    ]);

    await userRepo.save(users);
    console.log('Seeded 2 users: manager, staff');
  }

  const existingProducts = await productRepo.count();
  if (existingProducts === 0) {
    const products = productRepo.create([
      {
        name: 'Wireless Mouse',
        sku: 'WM-001',
        price: 29.99,
        status: ProductStatus.ACTIVE,
        inventoryCount: 150,
      },
      {
        name: 'Mechanical Keyboard',
        sku: 'MK-001',
        price: 89.99,
        status: ProductStatus.ACTIVE,
        inventoryCount: 75,
      },
      {
        name: 'USB-C Hub',
        sku: 'UCH-001',
        price: 49.99,
        status: ProductStatus.ACTIVE,
        inventoryCount: 200,
      },
      {
        name: 'Monitor Stand',
        sku: 'MS-001',
        price: 39.99,
        status: ProductStatus.ACTIVE,
        inventoryCount: 50,
      },
      {
        name: 'Webcam HD',
        sku: 'WC-001',
        price: 59.99,
        status: ProductStatus.INACTIVE,
        inventoryCount: 0,
      },
    ]);

    await productRepo.save(products);
    console.log('Seeded 5 products');
  }
}
