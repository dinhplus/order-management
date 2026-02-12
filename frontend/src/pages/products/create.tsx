import { Create, useForm } from '@refinedev/antd';
import { Form, Input, InputNumber, Select } from 'antd';

export const ProductCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Price" name="price" rules={[{ required: true }]}>
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Status" name="status" initialValue="active">
          <Select
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
        </Form.Item>
        <Form.Item label="Inventory Count" name="inventoryCount" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Create>
  );
};
