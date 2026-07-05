import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import AdminHeader from '../components/AdminHeader';
import Alert from '../components/Alert';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalSale, setGlobalSale] = useState(0);
    const [updatingSale, setUpdatingSale] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const navigate = useNavigate();

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const fetchAdminProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/dashboard');
            if (res.success) {
                setProducts(res.data || []);
            }
        } catch (err) {
            console.error(err);
            triggerAlert('error', 'Failed to retrieve inventory.');
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalSaleSetting = async () => {
        try {
            const res = await api.get('/admin/settings/global-sale');
            if (res.success) {
                setGlobalSale(res.data.globalDiscount || 0);
            }
        } catch (err) {
            console.error("Failed to load global sale setting:", err);
        }
    };

    const handleUpdateGlobalSale = async (e) => {
        e.preventDefault();
        setUpdatingSale(true);
        try {
            const res = await api.post('/admin/settings/global-sale', { globalDiscount: globalSale });
            if (res.success) {
                triggerAlert('success', `Global sale percentage updated successfully to ${globalSale}%.`);
                fetchAdminProducts();
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Failed to update global sale setting.');
        } finally {
            setUpdatingSale(false);
        }
    };

    const handleResetGlobalSale = async () => {
        setUpdatingSale(true);
        try {
            const res = await api.post('/admin/settings/global-sale', { globalDiscount: 0 });
            if (res.success) {
                setGlobalSale(0);
                triggerAlert('success', 'Global sale discount has been successfully reset to 0%.');
                fetchAdminProducts();
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Failed to reset global sale setting.');
        } finally {
            setUpdatingSale(false);
        }
    };

    useEffect(() => {
        fetchAdminProducts();
        fetchGlobalSaleSetting();
    }, []);

    const handleDeleteProduct = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
        try {
            const res = await api.delete(`/admin/products/${id}`);
            if (res.success) {
                triggerAlert('success', `Product "${name}" successfully deleted.`);
                fetchAdminProducts();
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Failed to delete product.');
        }
    };

    const adminName = user ? user.name : 'Admin';

    return (
        <div className="admin-layout">
            <AdminHeader />
            
            <main className="admin-main-panel">
                <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
                
                <div className="admin-panel-header">
                    <h2 style={{ fontSize: '32px', fontWeight: '300', textTransform: 'none', letterSpacing: '0' }}>
                        Inventory Overview
                    </h2>
                    <Link to="/admin/products/add" className="btn-primary" style={{ padding: '12px 25px', fontSize: '14px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                        + New Product
                    </Link>
                </div>

                {/* Welcome alert box */}
                <div style={{ backgroundColor: '#f4fbf7', borderLeft: '4px solid var(--success-green)', color: '#0f5132', padding: '15px 20px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '500', marginBottom: '30px' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--success-green)' }}></i> 
                    Welcome back, {adminName}!
                </div>

                {/* Global Sale Settings Control */}
                <div className="chart-box" style={{ padding: '25px', marginBottom: '30px', background: '#ffffff', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <h3 className="selector-title" style={{ marginBottom: '10px', fontSize: '18px', fontWeight: '600' }}>Global Store Sale Control</h3>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
                        Set a catalog-wide discount percentage. This discount will be dynamically applied to all product listings and cart calculations. Set to 0 to disable.
                    </p>
                    <form onSubmit={handleUpdateGlobalSale} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 0 200px' }}>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={globalSale} 
                                onChange={(e) => setGlobalSale(Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100))}
                                style={{ width: '90px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }} 
                            />
                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>% Catalog-wide Discount</span>
                        </div>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={updatingSale}
                            style={{ padding: '10px 20px', fontSize: '13px', textTransform: 'uppercase', height: '40px', cursor: 'pointer' }}
                        >
                            {updatingSale ? 'Applying...' : 'Apply Global Sale'}
                        </button>
                        {globalSale > 0 && (
                            <>
                                <button 
                                    type="button" 
                                    onClick={handleResetGlobalSale}
                                    className="btn-secondary" 
                                    disabled={updatingSale}
                                    style={{ padding: '10px 20px', fontSize: '13px', textTransform: 'uppercase', height: '40px', cursor: 'pointer', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px', fontWeight: 'bold' }}
                                >
                                    Reset Sale
                                </button>
                                <span style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    <i className="fa-solid fa-fire"></i> {globalSale}% OFF active on store
                                </span>
                            </>
                        )}
                    </form>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading products list...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="admin-th">Product</th>
                                    <th className="admin-th">Category</th>
                                    <th className="admin-th">Price</th>
                                    <th className="admin-th">Stock</th>
                                    <th className="admin-th" style={{ textAlign: 'center' }}>Manage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((prod) => {
                                    // Stock badge logic
                                    let stockBadge = null;
                                    if (prod.stock > 10) {
                                        stockBadge = <span className="stock-badge-success">{prod.stock} In Stock</span>;
                                    } else if (prod.stock > 0) {
                                        stockBadge = <span className="stock-badge-warning">{prod.stock} Low Stock</span>;
                                    } else {
                                        stockBadge = <span className="stock-badge-danger">Out Of Stock</span>;
                                    }

                                    return (
                                        <tr key={prod._id}>
                                            <td className="admin-td">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <img 
                                                        src={getImageUrl(prod.image)} 
                                                        alt={prod.name} 
                                                        style={{ width: '45px', height: '55px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} 
                                                    />
                                                    <span style={{ fontWeight: '600', color: '#111' }}>{prod.name}</span>
                                                </div>
                                            </td>
                                            <td className="admin-td" style={{ textTransform: 'capitalize', color: '#555' }}>
                                                {prod.category}
                                            </td>
                                            <td className="admin-td" style={{ fontWeight: '600' }}>
                                                Rs. {prod.price.toLocaleString()}
                                            </td>
                                            <td className="admin-td">
                                                {prod.category === 'kurta-pajama' || prod.category === 'waistcoats' ? (
                                                    <div style={{ fontSize: '12px' }}>
                                                        <div style={{ marginBottom: '5px' }}>{stockBadge}</div>
                                                        <span style={{ color: '#777' }}>XS: {prod.sizes?.XS || 0} | S: {prod.sizes?.S || 0} | M: {prod.sizes?.M || 0} | L: {prod.sizes?.L || 0} | XL: {prod.sizes?.XL || 0}</span>
                                                    </div>
                                                ) : (
                                                    <div>{stockBadge}</div>
                                                )}
                                            </td>
                                            <td className="admin-td" style={{ textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => navigate(`/admin/products/edit/${prod._id}`)}
                                                    className="admin-action-btn-outline"
                                                    style={{ marginRight: '10px' }}
                                                    title="Edit Product"
                                                >
                                                    <i className="fa-solid fa-pencil"></i>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteProduct(prod._id, prod.name)}
                                                    className="admin-action-btn-outline delete-btn"
                                                    title="Delete Product"
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
