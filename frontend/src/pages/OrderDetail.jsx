import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, BASE_URL } from '../utils/api';
import Alert from '../components/Alert';

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    // Alerts State
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const fetchOrderDetails = async () => {
        try {
            const res = await api.get(`/orders/${id}`);
            if (res.success) {
                setOrder(res.data);
            }
        } catch (err) {
            console.error(err);
            triggerAlert('error', 'Failed to retrieve order details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const handleDownloadInvoice = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            triggerAlert('error', 'Authentication token missing. Please log in again.');
            return;
        }
        // Open the download link directly with token in query params to bypass fetch and avoid IDM interception issues!
        window.open(`${BASE_URL}/orders/${id}/invoice?token=${token}`, '_blank');
        triggerAlert('success', 'PDF Invoice download initiated.');
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px' }}>Loading order receipt...</div>;
    }

    if (!order) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <h2>Order not found.</h2>
                <Link to="/orders" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Back to History</Link>
            </div>
        );
    }

    return (
        <div className="order-detail-container" style={{ padding: '20px' }}>
            <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />

            <div className="order-detail-sheet">
                <div className="order-detail-header">
                    <div>
                        <h2 style={{ letterSpacing: '1px', fontSize: '22px' }}>LIBAS-E-IKHLAQ INVOICE</h2>
                        <p style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                            Order: <strong style={{ fontFamily: 'monospace' }}>#{order._id}</strong>
                        </p>
                    </div>
                    <button
                        onClick={handleDownloadInvoice}
                        disabled={downloading}
                        className="btn-dark"
                        style={{ padding: '10px 20px', fontSize: '12px' }}
                    >
                        {downloading ? 'Downloading...' : 'Download PDF Invoice'}
                    </button>
                </div>

                <div className="address-grid">
                    <div className="address-box">
                        <h4>Order Details</h4>
                        <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                        <p><strong>Order Status:</strong> <span className={`status-badge status-${order.status}`} style={{ display: 'inline-block', padding: '2px 8px', marginTop: '5px' }}>{order.status}</span></p>
                        <p style={{ marginTop: '10px' }}><strong>Payment Method:</strong> {order.paymentMethod}</p>
                        <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
                    </div>

                    <div className="address-box">
                        <h4>Shipping Address</h4>
                        <p><strong>{order.shippingAddress.fullName}</strong></p>
                        <p>{order.shippingAddress.addressLine}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                        <p style={{ marginTop: '10px' }}><strong>Phone:</strong> {order.shippingAddress.phone}</p>
                    </div>
                </div>

                <h3 className="selector-title" style={{ fontSize: '14px', marginBottom: '15px' }}>Items Summary</h3>
                <div className="table-responsive" style={{ border: 'none', marginBottom: '30px' }}>
                    <table className="cart-table" style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ background: '#f9f9f9' }}>
                                <th className="cart-th" style={{ padding: '10px' }}>Item Description</th>
                                <th className="cart-th" style={{ textAlign: 'center', padding: '10px' }}>Quantity</th>
                                <th className="cart-th" style={{ textAlign: 'right', padding: '10px' }}>Unit Price</th>
                                <th className="cart-th" style={{ textAlign: 'right', padding: '10px' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                             {order.items.map((item, idx) => (
                                 <tr key={idx} className="cart-tr">
                                     <td className="cart-td" data-label="Item" style={{ padding: '12px 10px' }}>
                                         <span style={{ fontWeight: '600' }}>{item.name}</span>
                                         {item.size && <span style={{ fontSize: '11px', color: '#777', display: 'block' }}>Size: {item.size}</span>}
                                     </td>
                                     <td className="cart-td" data-label="Quantity" style={{ textAlign: 'center', padding: '12px 10px' }}>
                                         {item.quantity}
                                     </td>
                                     <td className="cart-td" data-label="Price" style={{ textAlign: 'right', padding: '12px 10px' }}>
                                         Rs. {item.price.toLocaleString()}
                                     </td>
                                     <td className="cart-td" data-label="Total" style={{ textAlign: 'right', fontWeight: '700', padding: '12px 10px' }}>
                                         Rs. {(item.price * item.quantity).toLocaleString()}
                                     </td>
                                 </tr>
                             ))}
                        </tbody>
                    </table>
                </div>

                <div className="order-summary-block">
                    {order.couponCode && (
                        <div className="summary-row" style={{ color: 'var(--brand-orange)' }}>
                            <span>Discount Coupon ({order.couponCode}):</span>
                            <span>Applied</span>
                        </div>
                    )}
                    <div className="summary-row summary-total" style={{ border: 'none', padding: 0 }}>
                        <span style={{ fontSize: '16px' }}>Total Amount Paid:</span>
                        <span style={{ fontSize: '20px' }}>Rs. {order.totalAmount.toLocaleString()}</span>
                    </div>
                </div>
                <div style={{ clear: 'both' }}></div>

                <div style={{ marginTop: '50px', textAlign: 'center', color: '#777', fontSize: '12px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    Thank you for shopping with Libas-e-Ikhlaq. This is a computer generated receipt invoice.
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
