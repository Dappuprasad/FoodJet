import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Spinner } from './components/Spinner';
import { ToastStack } from './components/ToastStack';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { MenuPage } from './pages/MenuPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { RegisterPage } from './pages/RegisterPage';

// Only staff ever open these, so they stay out of the main bundle.
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
);
const OrderHistoryPage = lazy(() =>
  import('./pages/OrderHistoryPage').then((module) => ({
    default: module.OrderHistoryPage,
  })),
);

function BackgroundParticles() {
  return (
    <div className="particles" aria-hidden="true">
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <BackgroundParticles />
            <Navbar />
            <ToastStack />

            <main>
              <Suspense
                fallback={
                  <div className="page">
                    <Spinner label="Loading..." />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<MenuPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/track/:id" element={<OrderTrackingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <OrderHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
