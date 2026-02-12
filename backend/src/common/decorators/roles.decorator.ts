import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import { type UserRole } from '@modules/users/enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]): CustomDecorator => SetMetadata(ROLES_KEY, roles);
