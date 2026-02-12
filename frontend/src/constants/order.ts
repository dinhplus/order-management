export const STATUS_COLORS: Record<string, string> = {
  pending: 'blue',
  confirmed: 'orange',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

export const NEXT_STATUS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
