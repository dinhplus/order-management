import { Edit, useForm } from '@refinedev/antd';
import { Form, Input } from 'antd';

export const OrderEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const version = queryResult?.data?.data?.version;

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        onFinish={(values: Record<string, unknown>) => {
          const payload = { ...values, version };
          return formProps.onFinish?.(payload);
        }}
      >
        <Form.Item label="Customer Reference" name="customerRef">
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
