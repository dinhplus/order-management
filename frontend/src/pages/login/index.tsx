import { useLogin } from '@refinedev/core';
import { Form, Input, Button, Card, Typography, Layout, theme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;

export const LoginPage = () => {
  const { mutate: login, isLoading } = useLogin();
  const { token } = theme.useToken();

  return (
    <Layout
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: token.colorBgLayout,
      }}
    >
      <Card style={{ width: 400, boxShadow: token.boxShadowTertiary }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Inventory & Order Management
        </Title>
        <Form layout="vertical" onFinish={(values) => login(values)} autoComplete="off">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input your username' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
};
