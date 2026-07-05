import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import AdminHeader from '../components/AdminHeader';
import Alert from '../components/Alert';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const fetchAdminReviews = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/reviews');
            if (res.success) {
                setReviews(res.data || []);
            }
        } catch (err) {
            console.error(err);
            triggerAlert('error', 'Failed to retrieve product reviews database.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminReviews();
    }, []);

    const handleDeleteReview = async (id, userName) => {
        if (!window.confirm(`Are you sure you want to delete the review submitted by "${userName}"?`)) return;

        try {
            const res = await api.delete(`/admin/reviews/${id}`);
            if (res.success) {
                triggerAlert('success', `Review submitted by "${userName}" successfully deleted.`);
                fetchAdminReviews();
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Failed to moderate/delete review.');
        }
    };

    return (
        <div className="admin-layout">
            <AdminHeader />
            
            <main className="admin-main-panel">
                <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
                
                <div className="admin-panel-header">
                    <h2 style={{ fontSize: '32px', fontWeight: '300', textTransform: 'none', letterSpacing: '0' }}>Reviews Moderation</h2>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading reviews database...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="admin-th">Product</th>
                                    <th className="admin-th">User / Author</th>
                                    <th className="admin-th" style={{ textAlign: 'center' }}>Rating</th>
                                    <th className="admin-th">Comment</th>
                                    <th className="admin-th" style={{ textAlign: 'center' }}>Submitted On</th>
                                    <th className="admin-th" style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map((rev) => (
                                    <tr key={rev._id}>
                                        <td className="admin-td" style={{ fontWeight: '600', maxWidth: '180px' }}>
                                            {rev.product?.name || 'Deleted Product'}
                                        </td>
                                        <td className="admin-td">
                                            <strong>{rev.userName || 'Anonymous'}</strong><br />
                                            <span style={{ fontSize: '11px', color: '#666' }}>{rev.user?.email || 'N/A'}</span>
                                        </td>
                                        <td className="admin-td" style={{ textAlign: 'center', color: '#ffb703', fontSize: '13px' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <i
                                                    key={i}
                                                    className={i < rev.rating ? 'fa-solid fa-star' : 'fa-regular fa-star'}
                                                ></i>
                                            ))}
                                        </td>
                                        <td className="admin-td" style={{ maxWidth: '300px', lineHeight: '1.4' }}>
                                            {rev.comment}
                                        </td>
                                        <td className="admin-td" style={{ textAlign: 'center', fontSize: '13px' }}>
                                            {new Date(rev.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="admin-td" style={{ textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleDeleteReview(rev._id, rev.userName)}
                                                className="btn-primary"
                                                style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--error-red)' }}
                                            >
                                                Remove Review
                                            </button>
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

export default AdminReviews;
