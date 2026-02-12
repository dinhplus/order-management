import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'manager' })
  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MANAGER })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.WAREHOUSE_STAFF })
  role: UserRole;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
