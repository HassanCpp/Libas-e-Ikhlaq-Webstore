import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import AdminHeader from '../components/AdminHeader';
import Alert from '../components/Alert';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const fetchAdminUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            if (res.success) {
                setUsers(res.data || []);
            }
        } catch (err) {
            console.error(err);
            triggerAlert('error', 'Failed to retrieve registered user database.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminUsers();
    }, []);

    const handleToggleRole = async (id, name, currentRole) => {
        const actionWord = currentRole === 'admin' ? 'demote' : 'promote';
        if (!window.confirm(`Are you sure you want to ${actionWord} "${name}"?`)) return;

        try {
            const res = await api.post(`/admin/users/role/${id}`);
            if (res.success) {
                triggerAlert('success', `User "${name}" role updated successfully!`);
                fetchAdminUsers();
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Operation forbidden by security policies.');
        }
    };

    return (
        <div className="admin-layout">
            <AdminHeader />
            
            <main className="admin-main-panel">
                <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
                
                <div className="admin-panel-header">
                    <h2 style={{ fontSize: '32px', fontWeight: '300', textTransform: 'none', letterSpacing: '0' }}>Customer Directory</h2>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading users database...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="admin-th">User Name</th>
                                    <th className="admin-th">Email Address</th>
                                    <th className="admin-th" style={{ textAlign: 'center' }}>Total Orders</th>
                                    <th className="admin-th" style={{ textAlign: 'center' }}>System Role</th>
                                    <th className="admin-th" style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((userObj) => (
                                    <tr key={userObj._id}>
                                        <td className="admin-td" style={{ fontWeight: '600' }}>
                                            {userObj.name}
                                        </td>
                                        <td className="admin-td">
                                            {userObj.email}
                                        </td>
                                        <td className="admin-td" style={{ textAlign: 'center', fontWeight: '600' }}>
                                            {userObj.orderCount || 0}
                                        </td>
                                        <td className="admin-td" style={{ textAlign: 'center' }}>
                                            <span className={`status-badge ${userObj.role === 'admin' ? 'status-delivered' : 'status-processing'}`} style={{ minWidth: '80px', display: 'inline-block' }}>
                                                {userObj.role}
                                            </span>
                                        </td>
                                        <td className="admin-td" style={{ textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleToggleRole(userObj._id, userObj.name, userObj.role)}
                                                className="btn-dark"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                Toggle Role
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

export default AdminUsers;
