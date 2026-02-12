import {
  List,
  useTable,
  EditButton,
  ShowButton,
  DeleteButton,
  FilterDropdown,
} from '@refinedev/antd';
import { usePermissions } from '@refinedev/core';
import { Table, Space, Tag, Input, Select } from 'antd';
import type { IProduct } from '../../interfaces';

export const ProductList = () => {
  const { tableProps } = useTable<IProduct>({
    syncWithLocation: true,
  });

  const { data: role } = usePermissions<string>();
  const isManager = role === 'manager';

  return (
    <List canCreate={isManager}>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="name"
          title="Name"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search name" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="sku"
          title="SKU"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search SKU" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="price"
          title="Price"
          render={(value: number) => `$${Number(value).toFixed(2)}`}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(value: string) => (
            <Tag color={value === 'active' ? 'green' : 'red'}>{value.toUpperCase()}</Tag>
          )}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ width: 150 }}
                placeholder="Filter status"
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column dataIndex="inventoryCount" title="Inventory" />
        <Table.Column
          title="Actions"
          render={(_, record: IProduct) => (
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
