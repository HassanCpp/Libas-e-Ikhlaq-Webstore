import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import AdminHeader from '../components/AdminHeader';
import Alert from '../components/Alert';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const fetchAdminOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/orders');
            if (res.success) {
                setOrders(res.data || []);
            }
        } catch (err) {
            console.error(err);
            triggerAlert('error', 'Failed to retrieve orders list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminOrders();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await api.post(`/admin/orders/status/${id}`, { orderStatus: newStatus });
            if (res.success) {
                triggerAlert('success', `Order #${id} status changed to ${newStatus}.`);
                fetchAdminOrders();
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Failed to update status.');
        }
    };

    const handlePaymentStatusChange = async (id, newPaymentStatus) => {
        try {
            const res = await api.post(`/admin/orders/status/${id}`, { paymentStatus: newPaymentStatus });
            if (res.success) {
                triggerAlert('success', `Order #${id} payment status changed to ${newPaymentStatus}.`);
                fetchAdminOrders();
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Failed to update payment status.');
        }
    };

    return (
        <div className="admin-layout">
            <AdminHeader />
            
            <main className="admin-main-panel">
                <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
                
                <div className="admin-panel-header">
                    <h2 style={{ fontSize: '32px', fontWeight: '300', textTransform: 'none', letterSpacing: '0' }}>Customer Orders</h2>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading orders list...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="admin-th">Order ID</th>
                                    <th className="admin-th">Recipient</th>
                                    <th className="admin-th">Total Paid</th>
                                    <th className="admin-th">Payment Info</th>
                                    <th className="admin-th">Order Status</th>
                                    <th className="admin-th">Order Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id}>
                                        <td className="admin-td" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                            #{order._id}
                                        </td>
                                        <td className="admin-td">
                                            <strong>{order.shippingAddress?.fullName}</strong><br />
                                            {order.shippingAddress?.phone}
                                        </td>
                                        <td className="admin-td" style={{ fontWeight: '700' }}>
                                            Rs. {order.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="admin-td">
                                            <div style={{ fontSize: '13px' }}>
                                                Method: {order.paymentMethod}<br />
                                                Status: &nbsp;
                                                <select
                                                    value={order.paymentStatus}
                                                    onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                                                    className="sort-dropdown"
                                                    style={{ padding: '4px', fontSize: '12px' }}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Paid">Paid</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="admin-td">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                className="sort-dropdown"
                                                style={{ padding: '6px', fontSize: '13px', fontWeight: '600' }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="admin-td" style={{ fontSize: '13px' }}>
                                            {new Date(order.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminOrders;
