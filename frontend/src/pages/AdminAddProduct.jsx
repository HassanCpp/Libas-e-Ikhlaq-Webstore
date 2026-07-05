import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import AdminHeader from '../components/AdminHeader';
import Alert from '../components/Alert';

const AdminAddProduct = () => {
    const navigate = useNavigate();

    // Form inputs state
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('');
    const [category, setCategory] = useState('unstitched');
    const [stock, setStock] = useState('10');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);

    // Sizing stock state
    const [sizes, setSizes] = useState({ XS: 0, S: 0, M: 0, L: 0, XL: 0 });

    // Alerts State
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [submitting, setSubmitting] = useState(false);

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const isClothing = category === 'kurta-pajama' || category === 'waistcoats';

    const handleSizeChange = (sizeName, value) => {
        const val = parseInt(value) || 0;
        setSizes(prev => ({ ...prev, [sizeName]: val }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim() || !price || !category) {
            triggerAlert('error', 'Product name, price and category are required.');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('price', price);
            formData.append('discountPrice', discountPrice);
            formData.append('category', category);
            formData.append('description', description.trim());
            
            if (imageFile) {
                formData.append('image', imageFile);
            }

            if (isClothing) {
                formData.append('sizes', JSON.stringify(sizes));
                // Stock is dynamically calculated from size totals
                const totalStock = Object.values(sizes).reduce((a, b) => a + b, 0);
                formData.append('stock', totalStock.toString());
            } else {
                formData.append('stock', stock);
            }

            const res = await api.post('/admin/products', formData);
            if (res.success) {
                navigate('/admin');
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Failed to create product.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-layout">
            <AdminHeader />
            
            <main className="admin-main-panel">
                <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
                
                <div className="admin-panel-header">
                    <h2 style={{ fontSize: '32px', fontWeight: '300', textTransform: 'none', letterSpacing: '0' }}>Add Product</h2>
                    <Link to="/admin" className="btn-dark" style={{ padding: '10px 20px', fontSize: '13px' }}>
                        &larr; Back
                    </Link>
                </div>

                <div className="reviews-form-col" style={{ width: '100%', maxWidth: '700px' }}>
                    <form onSubmit={handleFormSubmit}>
                        <div className="form-group">
                            <label className="form-label">Product Name</label>
                            <input
                                type="text"
                                placeholder="Enter product title"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div className="form-group" style={{ flexGrow: 1 }}>
                                <label className="form-label">Retail Price (PKR)</label>
                                <input
                                    type="number"
                                    placeholder="Retail Price"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ flexGrow: 1 }}>
                                <label className="form-label">Discount Price (Optional)</label>
                                <input
                                    type="number"
                                    placeholder="Discount Price"
                                    value={discountPrice}
                                    onChange={(e) => setDiscountPrice(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div className="form-group" style={{ flexGrow: 1 }}>
                                <label className="form-label">Category</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)} 
                                    className="sort-dropdown"
                                    style={{ width: '100%', padding: '12px' }}
                                >
                                    <option value="unstitched">Unstitched Fabric</option>
                                    <option value="kurta-pajama">Kurta Pajama</option>
                                    <option value="waistcoats">Waistcoats</option>
                                    <option value="fragrance">Fragrance</option>
                                    <option value="accessories">Accessories</option>
                                </select>
                            </div>

                            {!isClothing && (
                                <div className="form-group" style={{ flexGrow: 1 }}>
                                    <label className="form-label">Stock Quantity</label>
                                    <input
                                        type="number"
                                        placeholder="Available Stock"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        className="form-input"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {isClothing && (
                            <div className="address-box" style={{ background: '#f9f9f9', marginBottom: '20px', border: '1px dashed var(--brand-orange)' }}>
                                <h4 style={{ margin: 0, marginBottom: '15px' }}>Clothing Sizes Stock Allocation</h4>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    {['XS', 'S', 'M', 'L', 'XL'].map((sz) => (
                                        <div key={sz} className="form-group" style={{ flexGrow: 1, marginBottom: 0 }}>
                                            <label className="form-label" style={{ textAlign: 'center' }}>{sz}</label>
                                            <input
                                                type="number"
                                                value={sizes[sz]}
                                                onChange={(e) => handleSizeChange(sz, e.target.value)}
                                                className="form-input"
                                                style={{ textAlign: 'center', padding: '8px' }}
                                                min="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '15px', fontSize: '13px', fontWeight: '700', color: 'var(--brand-orange)', textAlign: 'right' }}>
                                    Total Calculated Stock: {Object.values(sizes).reduce((a, b) => a + b, 0)}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                placeholder="Enter description detailing the fabric, weave, size information, fragrance notes, etc..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="review-textarea"
                            ></textarea>
                        </div>

                        <div className="form-group" style={{ marginBottom: '30px' }}>
                            <label className="form-label">Product Image File</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files[0])}
                                style={{ border: 'none', background: 'none', padding: 0 }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary"
                            style={{ width: '100%', padding: '15px 0' }}
                        >
                            {submitting ? 'Creating Product...' : 'Add Product to Catalog'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AdminAddProduct;
