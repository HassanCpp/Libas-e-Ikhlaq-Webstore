import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const OrdersList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/orders');
                if (res.success) {
                    setOrders(res.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px' }}>Loading your orders...</div>;
    }

    return (
        <div className="orders-page-container">
            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '30px' }}>Order History</h1>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <i className="fa-solid fa-receipt" style={{ fontSize: '50px', color: '#ccc', marginBottom: '15px' }}></i>
                    <h3>You have not placed any orders yet.</h3>
                    <Link to="/products" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Start Shopping</Link>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="admin-th">Order ID</th>
                                <th className="admin-th">Date</th>
                                <th className="admin-th">Payment</th>
                                <th className="admin-th" style={{ textAlign: 'right' }}>Total</th>
                                <th className="admin-th" style={{ textAlign: 'center' }}>Status</th>
                                <th className="admin-th" style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id}>
                                    <td className="admin-td" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                        #{order._id}
                                    </td>
                                    <td className="admin-td">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="admin-td">
                                        {order.paymentMethod} ({order.paymentStatus})
                                    </td>
                                    <td className="admin-td" style={{ textAlign: 'right', fontWeight: '700' }}>
                                        Rs. {order.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="admin-td" style={{ textAlign: 'center' }}>
                                        <span className={`status-badge status-${order.status}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="admin-td" style={{ textAlign: 'center' }}>
                                        <Link to={`/orders/${order._id}`} className="view-order-btn">
                                            View Invoice
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrdersList;
