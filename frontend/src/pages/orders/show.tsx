import { Show } from '@refinedev/antd';
import { useShow, useUpdate, usePermissions } from '@refinedev/core';
import { Typography, Tag, Descriptions, Table, Button, Space, message } from 'antd';
import type { IOrder, IOrderItem } from '../../interfaces';
import { STATUS_COLORS, NEXT_STATUS } from '../../constants/order';

const { Title } = Typography;

export const OrderShow = () => {
  const { queryResult } = useShow<IOrder>();
  const record = queryResult?.data?.data;
  const { mutate: updateStatus, isLoading } = useUpdate();
  const { data: role } = usePermissions<string>();
  const isManager = role === 'manager';

  const handleStatusChange = (newStatus: string) => {
    if (!record) return;

    updateStatus(
      {
        resource: 'orders',
        id: `${record.id}/status`,
        values: { status: newStatus, version: record.version },
      },
      {
        onSuccess: () => {
          message.success(`Order status updated to ${newStatus}`);
          queryResult?.refetch();
        },
        onError: (error) => {
          message.error(error.message || 'Failed to update status');
        },
      },
    );
  };

  const availableTransitions = record ? NEXT_STATUS[record.status] || [] : [];

  return (
    <Show>
      <Title level={5}>Order Details</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Order Number">{record?.orderNumber}</Descriptions.Item>
        <Descriptions.Item label="Customer Reference">{record?.customerRef}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[record?.status || ''] || 'default'}>
            {record?.status?.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Total Amount">
          ${Number(record?.totalAmount || 0).toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {record?.createdAt ? new Date(record.createdAt).toLocaleString() : ''}
        </Descriptions.Item>
      </Descriptions>

      {availableTransitions.length > 0 && (
        <>
          <Title level={5} style={{ marginTop: 24 }}>
            Update Status
          </Title>
          <Space>
            {availableTransitions.map((status) => {
              if (status === 'cancelled' && !isManager) return null;
              return (
                <Button
                  key={status}
                  type={status === 'cancelled' ? 'default' : 'primary'}
                  danger={status === 'cancelled'}
                  loading={isLoading}
                  onClick={() => handleStatusChange(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              );
            })}
          </Space>
        </>
      )}

      <Title level={5} style={{ marginTop: 24 }}>
        Line Items
      </Title>
      <Table dataSource={record?.items} rowKey="id" pagination={false}>
        <Table.Column
          title="Product"
          render={(_, item: IOrderItem) => item.product?.name || item.productId}
        />
        <Table.Column dataIndex="quantity" title="Quantity" />
        <Table.Column
          dataIndex="unitPrice"
          title="Unit Price"
          render={(v: number) => `$${Number(v).toFixed(2)}`}
        />
        <Table.Column
          dataIndex="subtotal"
          title="Subtotal"
          render={(v: number) => `$${Number(v).toFixed(2)}`}
        />
      </Table>
    </Show>
  );
};
