import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Typography, Tag, Descriptions } from 'antd';
import type { IProduct } from '../../interfaces';

const { Title } = Typography;

export const ProductShow = () => {
  const { queryResult } = useShow<IProduct>();
  const record = queryResult?.data?.data;

  return (
    <Show>
      <Title level={5}>Product Details</Title>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Name">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="SKU">{record?.sku}</Descriptions.Item>
        <Descriptions.Item label="Price">
          ${Number(record?.price || 0).toFixed(2)}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={record?.status === 'active' ? 'green' : 'red'}>
            {record?.status?.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Inventory Count">{record?.inventoryCount}</Descriptions.Item>
        <Descriptions.Item label="Created At">
          {record?.createdAt ? new Date(record.createdAt).toLocaleString() : ''}
        </Descriptions.Item>
        <Descriptions.Item label="Updated At">
          {record?.updatedAt ? new Date(record.updatedAt).toLocaleString() : ''}
        </Descriptions.Item>
        <Descriptions.Item label="Version">{record?.version}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
