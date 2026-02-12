import { Refine, Authenticated } from '@refinedev/core';
import { ThemedLayoutV2, useNotificationProvider, RefineThemes } from '@refinedev/antd';
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from '@refinedev/react-router';
import { BrowserRouter, Route, Routes, Outlet, Navigate } from 'react-router';
import { ConfigProvider, App as AntdApp } from 'antd';
import { ShoppingCartOutlined, AppstoreOutlined } from '@ant-design/icons';

import '@refinedev/antd/dist/reset.css';

import { authProvider } from '@/authProvider';
import { dataProvider } from '@/dataProvider';
import { accessControlProvider } from '@/accessControlProvider';

import { LoginPage } from '@/pages/login';
import { ProductList } from '@/pages/products/list';
import { ProductCreate } from '@/pages/products/create';
import { ProductEdit } from '@/pages/products/edit';
import { ProductShow } from '@/pages/products/show';
import { OrderList } from '@/pages/orders/list';
import { OrderCreate } from '@/pages/orders/create';
import { OrderEdit } from '@/pages/orders/edit';
import { OrderShow } from '@/pages/orders/show';

const App = () => {
  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider}
            authProvider={authProvider}
            accessControlProvider={accessControlProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: 'products',
                list: '/products',
                create: '/products/create',
                edit: '/products/edit/:id',
                show: '/products/show/:id',
                meta: { icon: <AppstoreOutlined /> },
              },
              {
                name: 'orders',
                list: '/orders',
                create: '/orders/create',
                edit: '/orders/edit/:id',
                show: '/orders/show/:id',
                meta: { icon: <ShoppingCartOutlined /> },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated
                    key="authenticated-routes"
                    fallback={<CatchAllNavigate to="/login" />}
                  >
                    <ThemedLayoutV2
                      Title={() => (
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Inventory & Orders</span>
                      )}
                    >
                      <Outlet />
                    </ThemedLayoutV2>
                  </Authenticated>
                }
              >
                <Route index element={<NavigateToResource resource="products" />} />
                <Route path="/products">
                  <Route index element={<ProductList />} />
                  <Route path="create" element={<ProductCreate />} />
                  <Route path="edit/:id" element={<ProductEdit />} />
                  <Route path="show/:id" element={<ProductShow />} />
                </Route>
                <Route path="/orders">
                  <Route index element={<OrderList />} />
                  <Route path="create" element={<OrderCreate />} />
                  <Route path="edit/:id" element={<OrderEdit />} />
                  <Route path="show/:id" element={<OrderShow />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>

              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <NavigateToResource resource="products" />
                  </Authenticated>
                }
              >
                <Route path="/login" element={<LoginPage />} />
              </Route>
            </Routes>

            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
