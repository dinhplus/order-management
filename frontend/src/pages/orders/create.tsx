import { Create, useForm, useSelect } from '@refinedev/antd';
import { Form, Input, InputNumber, Select, Button, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMemo, useCallback } from 'react';
import type { IProduct } from '../../interfaces';

export const OrderCreate = () => {
  const { formProps, saveButtonProps } = useForm();
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const { selectProps: productSelectProps } = useSelect<IProduct>({
    resource: 'products',
    optionLabel: (item) => item.name,
    optionValue: (item) => item.id,
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
  });

  const getSelectedProductIds = useCallback((): string[] => {
    const items = formProps.form?.getFieldValue('items') as
      | Array<{ productId?: string }>
      | undefined;
    if (!items) return [];
    return items.filter((item) => item?.productId).map((item) => item.productId as string);
  }, [formProps.form]);

  const getFilteredOptions = useCallback(
    (currentIndex: number) => {
      const selectedIds = getSelectedProductIds();
      const items = formProps.form?.getFieldValue('items') as
        | Array<{ productId?: string }>
        | undefined;
      const currentId = items?.[currentIndex]?.productId;

      return (
        productSelectProps.options?.filter(
          (opt) => !selectedIds.includes(String(opt.value)) || String(opt.value) === currentId,
        ) ?? []
      );
    },
    [productSelectProps.options, getSelectedProductIds, formProps.form],
  );

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        onFinish={(values: Record<string, unknown>) => {
          const payload = { ...values, idempotencyKey };
          return formProps.onFinish?.(payload);
        }}
      >
        <Form.Item label="Customer Reference" name="customerRef" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.List name="items" initialValue={[{}]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'productId']}
                    rules={[{ required: true, message: 'Select a product' }]}
                    label={name === 0 ? 'Product' : undefined}
                  >
                    <Select
                      {...productSelectProps}
                      options={getFilteredOptions(name)}
                      placeholder="Select product"
                      style={{ width: 250 }}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    rules={[{ required: true, message: 'Enter quantity' }]}
                    label={name === 0 ? 'Quantity' : undefined}
                  >
                    <InputNumber min={1} placeholder="Qty" />
                  </Form.Item>
                  {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} />}
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                  }}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Create>
  );
};
