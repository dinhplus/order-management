import type { components } from './api';

export type IProduct = components['schemas']['Product'];
export type IOrderItem = components['schemas']['OrderItem'];
export type IOrder = components['schemas']['Order'];

export interface IUser {
  id: string;
  username: string;
  role: 'manager' | 'warehouse_staff';
}

export interface ILoginResponse {
  accessToken: string;
  user: IUser;
}
