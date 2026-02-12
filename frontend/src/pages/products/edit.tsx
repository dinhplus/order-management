import { Edit, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Select } from 'antd';

export const ProductEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const version = queryResult?.data?.data?.version;

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        onFinish={(values: Record<string, unknown>) => {
          const payload = {
            ...values,
            price: Number(values.price),
            inventoryCount: Number(values.inventoryCount),
            version,
          };
          return formProps.onFinish?.(payload);
        }}
      >
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Price" name="price" rules={[{ required: true }]}>
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Status" name="status">
          <Select
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
        </Form.Item>
        <Form.Item label="Inventory Count" name="inventoryCount">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
