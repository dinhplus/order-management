import {
  List,
  useTable,
  ShowButton,
  EditButton,
  DeleteButton,
  FilterDropdown,
} from '@refinedev/antd';
import { usePermissions } from '@refinedev/core';
import { Table, Space, Tag, Input, Select } from 'antd';
import type { IOrder } from '../../interfaces';
import { STATUS_COLORS } from '../../constants/order';

export const OrderList = () => {
  const { tableProps } = useTable<IOrder>({
    syncWithLocation: true,
  });

  const { data: role } = usePermissions<string>();
  const isManager = role === 'manager';

  return (
    <List canCreate={isManager}>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="orderNumber"
          title="Order #"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search order #" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="customerRef"
          title="Customer Ref"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search customer" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(value: string) => (
            <Tag color={STATUS_COLORS[value] || 'default'}>{value.toUpperCase()}</Tag>
          )}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ width: 150 }}
                placeholder="Filter status"
                options={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Confirmed', value: 'confirmed' },
                  { label: 'Shipped', value: 'shipped' },
                  { label: 'Delivered', value: 'delivered' },
                  { label: 'Cancelled', value: 'cancelled' },
                ]}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="totalAmount"
          title="Total"
          render={(value: number) => `$${Number(value).toFixed(2)}`}
        />
        <Table.Column
          dataIndex="createdAt"
          title="Created"
          render={(value: string) => new Date(value).toLocaleDateString()}
        />
        <Table.Column
          title="Actions"
          render={(_, record: IOrder) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              {isManager && (
                <>
                  <EditButton hideText size="small" recordItemId={record.id} />
                  <DeleteButton hideText size="small" recordItemId={record.id} />
                </>
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
