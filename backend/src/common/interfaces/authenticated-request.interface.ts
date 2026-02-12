import { type Request } from 'express';
import { type UserRole } from '@modules/users/enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
