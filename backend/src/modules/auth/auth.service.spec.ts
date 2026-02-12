import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '@modules/users/users.service';
import { type User } from '@modules/users/entities/user.entity';
import { UserRole } from '@modules/users/enums/user-role.enum';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByUsername: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const mockUser: User = {
    id: 'uuid-1',
    username: 'manager',
    password: '$2b$10$hashedpassword',
    role: UserRole.MANAGER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByUsername: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('manager', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('should throw when user not found', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(service.validateUser('unknown', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw when password is invalid', async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('manager', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const result = service.login(mockUser);

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
    });
  });
});
