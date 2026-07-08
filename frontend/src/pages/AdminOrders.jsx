import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import AdminHeader from '../components/AdminHeader';
import Alert from '../components/Alert';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [expandedOrders, setExpandedOrders] = useState({});

    const toggleOrderExpand = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const handleViewInvoice = (id) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
        window.open(`${BASE_URL}/orders/${id}/invoice?token=${token}`, '_blank');
    };

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
                                    <th className="admin-th" style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <React.Fragment key={order._id}>
                                        <tr>
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
                                            <td className="admin-td" style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => toggleOrderExpand(order._id)}
                                                    className="btn-dark"
                                                    style={{ padding: '6px 12px', fontSize: '11px', background: expandedOrders[order._id] ? '#777' : '#222' }}
                                                >
                                                    {expandedOrders[order._id] ? 'Hide' : 'Details'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedOrders[order._id] && (
                                            <tr style={{ background: '#fdfdfd' }}>
                                                <td colSpan="7" style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
                                                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', textAlign: 'left' }}>
                                                        <div style={{ flex: '1', minWidth: '220px' }}>
                                                            <h4 style={{ margin: '0 0 10px 0', color: 'var(--brand-orange)', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                                                Shipping Address
                                                            </h4>
                                                            <p style={{ margin: '6px 0', fontSize: '13px' }}><strong>Recipient Name:</strong> {order.shippingAddress?.fullName}</p>
                                                            <p style={{ margin: '6px 0', fontSize: '13px' }}><strong>Address Line:</strong> {order.shippingAddress?.addressLine}</p>
                                                            <p style={{ margin: '6px 0', fontSize: '13px' }}><strong>City:</strong> {order.shippingAddress?.city}</p>
                                                            <p style={{ margin: '6px 0', fontSize: '13px' }}><strong>Postal Code:</strong> {order.shippingAddress?.postalCode}</p>
                                                            <p style={{ margin: '6px 0', fontSize: '13px' }}><strong>Contact Phone:</strong> {order.shippingAddress?.phone}</p>
                                                        </div>
                                                        <div style={{ flex: '2', minWidth: '320px' }}>
                                                            <h4 style={{ margin: '0 0 10px 0', color: 'var(--brand-orange)', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                                                Items Ordered
                                                            </h4>
                                                            <div className="table-responsive">
                                                                <table className="cart-table" style={{ width: '100%', background: '#fff', border: '1px solid #eee', margin: 0 }}>
                                                                    <thead>
                                                                        <tr style={{ background: '#f5f5f5' }}>
                                                                            <th style={{ padding: '8px', fontSize: '11px', fontWeight: 'bold' }}>Product Description</th>
                                                                            <th style={{ padding: '8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Size</th>
                                                                            <th style={{ padding: '8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>Qty</th>
                                                                            <th style={{ padding: '8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>Price</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {order.items?.map((item, idx) => (
                                                                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                                                <td style={{ padding: '8px', fontSize: '12px' }}>{item.name}</td>
                                                                                <td style={{ padding: '8px', fontSize: '12px', textAlign: 'center', fontWeight: '600' }}>{item.size || '-'}</td>
                                                                                <td style={{ padding: '8px', fontSize: '12px', textAlign: 'center' }}>{item.quantity}</td>
                                                                                <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right' }}>Rs. {item.price.toLocaleString()}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <div style={{ marginTop: '15px' }}>
                                                                <button
                                                                    onClick={() => handleViewInvoice(order._id)}
                                                                    className="btn-dark"
                                                                    style={{ padding: '6px 12px', fontSize: '11px' }}
                                                                >
                                                                    View PDF Invoice
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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
