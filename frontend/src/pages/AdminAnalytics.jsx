import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import AdminHeader from '../components/AdminHeader';
import Alert from '../components/Alert';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AdminAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/admin/analytics');
                if (res.success) {
                    setAnalytics(res.data);
                }
            } catch (err) {
                console.error(err);
                triggerAlert('error', 'Failed to retrieve analytics metrics.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px' }}>Loading analytics panel...</div>;
    }

    if (!analytics) {
        return (
            <div className="admin-layout">
                <AdminHeader />
                <main className="admin-main-panel">
                    <h2 style={{ fontSize: '32px', fontWeight: '300', textTransform: 'none', letterSpacing: '0' }}>Analytics dashboard unavailable.</h2>
                </main>
            </div>
        );
    }

    // Chart Data config
    const monthlyRev = analytics.monthlyRevenue || [];
    const chartData = {
        labels: monthlyRev.map(m => m.month),
        datasets: [
            {
                label: 'Sales Revenue (PKR)',
                data: monthlyRev.map(m => m.revenue),
                borderColor: '#E85624',
                backgroundColor: 'rgba(232, 86, 36, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#000000',
                borderWidth: 3
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        family: 'Montserrat',
                        weight: 'bold'
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => 'Rs. ' + value.toLocaleString()
                }
            }
        }
    };

    return (
        <div className="admin-layout">
            <AdminHeader />
            
            <main className="admin-main-panel">
                <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
                
                <div className="admin-panel-header">
                    <h2 style={{ fontSize: '32px', fontWeight: '300', textTransform: 'none', letterSpacing: '0' }}>Sales & Operations Analytics</h2>
                </div>

                <div className="admin-card-row">
                    <div className="analytics-card">
                        <h4>Gross Revenue</h4>
                        <div className="analytics-val">Rs. {(analytics.totalRevenue || 0).toLocaleString()}</div>
                    </div>
                    <div className="analytics-card">
                        <h4>Total Orders</h4>
                        <div className="analytics-val">{analytics.totalOrders || 0} orders</div>
                    </div>
                    <div className="analytics-card">
                        <h4>Active Members</h4>
                        <div className="analytics-val">{analytics.totalUsers || 0} clients</div>
                    </div>
                    <div className="analytics-card" style={{ borderLeft: '4px solid var(--error-red)' }}>
                        <h4>Low Stock Items</h4>
                        <div className="analytics-val" style={{ color: 'var(--error-red)' }}>{analytics.lowStockCount || 0} items</div>
                    </div>
                </div>

                <div className="chart-box">
                    <h3 className="selector-title" style={{ marginBottom: '20px' }}>Sales Trend Over Time</h3>
                    <div style={{ height: '320px', position: 'relative' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                <div className="analytics-layout-grid">
                    <div className="analytics-col">
                        <div className="reviews-form-col" style={{ width: '100%', minHeight: '350px' }}>
                            <h3 className="selector-title" style={{ marginBottom: '15px' }}>Top-Selling Products</h3>
                            <div className="table-responsive">
                                <table className="admin-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th className="admin-th">Product</th>
                                            <th className="admin-th" style={{ textAlign: 'center' }}>Sales</th>
                                            <th className="admin-th" style={{ textAlign: 'right' }}>Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(analytics.topProducts || []).map((p, idx) => (
                                            <tr key={idx}>
                                                <td className="admin-td" style={{ fontWeight: '600' }}>{p.name}</td>
                                                <td className="admin-td" style={{ textAlign: 'center' }}>{p.salesCount} items</td>
                                                <td className="admin-td" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--brand-orange)' }}>
                                                    Rs. {p.revenue.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="analytics-col">
                        <div className="reviews-form-col" style={{ width: '100%', minHeight: '350px' }}>
                            <h3 className="selector-title" style={{ marginBottom: '15px', color: 'var(--error-red)' }}>
                                Low Stock / Out of Stock Warnings
                            </h3>
                            <div className="table-responsive">
                                <table className="admin-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th className="admin-th">Product</th>
                                            <th className="admin-th" style={{ textAlign: 'center' }}>Status</th>
                                            <th className="admin-th" style={{ textAlign: 'center' }}>Remaining Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(analytics.lowStockProducts || []).map((p, idx) => (
                                            <tr key={idx}>
                                                <td className="admin-td" style={{ fontWeight: '600' }}>{p.name}</td>
                                                <td className="admin-td" style={{ textAlign: 'center' }}>
                                                    <span className={`status-badge ${p.stock === 0 ? 'status-cancelled' : 'status-pending'}`}>
                                                        {p.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                                                    </span>
                                                </td>
                                                <td className="admin-td" style={{ textAlign: 'center', fontWeight: '700', color: 'var(--error-red)' }}>
                                                    {p.stock} left
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminAnalytics;
