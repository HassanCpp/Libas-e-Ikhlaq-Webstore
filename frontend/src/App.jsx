import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Customer Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrdersList from './pages/OrdersList';
import OrderDetail from './pages/OrderDetail';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminAddProduct from './pages/AdminAddProduct';
import AdminEditProduct from './pages/AdminEditProduct';
import AdminOrders from './pages/AdminOrders';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminUsers from './pages/AdminUsers';
import AdminReviews from './pages/AdminReviews';

// Route guards
const ProtectedRoute = ({ children }) => {
    const { token, loading } = useContext(AuthContext);
    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>;
    return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user, token, loading } = useContext(AuthContext);
    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>;
    return (token && user && user.role === 'admin') ? children : <Navigate to="/login" replace />;
};

// Layout wrapper to conditionally hide header/footer on admin pages
const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');

    return (
        <div className="app-container">
            {!isAdminPage && <Header />}
            <main className="main-content">
                {children}
            </main>
            {!isAdminPage && <Footer />}
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <LayoutWrapper>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<Home />} />
                            <Route path="/products" element={<Catalog />} />
                            <Route path="/products/:id" element={<ProductDetail />} />
                            <Route path="/contact-us" element={<Contact />} />

                            {/* Auth routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />

                            {/* Protected customer routes */}
                            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                            <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                            <Route path="/orders" element={<ProtectedRoute><OrdersList /></ProtectedRoute>} />
                            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

                            {/* Protected admin routes */}
                            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                            <Route path="/admin/products/add" element={<AdminRoute><AdminAddProduct /></AdminRoute>} />
                            <Route path="/admin/products/edit/:id" element={<AdminRoute><AdminEditProduct /></AdminRoute>} />
                            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                            <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />

                            {/* Catch-all */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </LayoutWrapper>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
