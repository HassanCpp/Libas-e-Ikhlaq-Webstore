import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import Alert from '../components/Alert';
import { getImageUrl } from '../utils/api';

const Cart = () => {
    const { cartItems, subtotal, updateCartQty, removeFromCart } = useContext(CartContext);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const navigate = useNavigate();

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const handleQtyChange = async (productId, currentQty, increment, size = null) => {
        const newQty = increment ? currentQty + 1 : currentQty - 1;
        if (newQty < 1) return;
        try {
            await updateCartQty(productId, newQty, size);
        } catch (err) {
            triggerAlert('error', err.message);
        }
    };

    const handleRemoveClick = async (productId, size = null) => {
        try {
            await removeFromCart(productId, size);
            triggerAlert('success', 'Item removed from shopping bag.');
        } catch (err) {
            triggerAlert('error', err.message);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 50px' }}>
                <i className="fa-solid fa-bag-shopping" style={{ fontSize: '60px', color: '#ccc', marginBottom: '20px' }}></i>
                <h2>Your Shopping Bag is Empty</h2>
                <p style={{ color: '#777', margin: '15px 0 30px' }}>Browse our collections to add premium items to your bag.</p>
                <Link to="/products" className="btn-primary">Shop Our Catalog</Link>
            </div>
        );
    }

    return (
        <div className="cart-page-container">
            <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '30px' }}>Shopping Bag</h1>

            <div className="cart-layout">
                <div className="cart-table-col">
                    <table className="cart-table">
                        <thead>
                            <tr>
                                <th className="cart-th">Product Details</th>
                                <th className="cart-th">Price</th>
                                <th className="cart-th" style={{ textAlign: 'center' }}>Quantity</th>
                                <th className="cart-th" style={{ textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item, idx) => {
                                const activePrice = (item.product.discountPrice && item.product.discountPrice < item.product.price) 
                                    ? item.product.discountPrice 
                                    : item.product.price;
                                const itemTotal = activePrice * item.quantity;
                                return (
                                    <tr key={`${item.product._id}-${item.size || idx}`} className="cart-tr">
                                        <td className="cart-td">
                                            <div className="cart-item-meta">
                                                <img 
                                                    src={getImageUrl(item.product.image)} 
                                                    alt={item.product.name} 
                                                    className="cart-item-img" 
                                                />
                                                <div>
                                                    <Link to={`/products/${item.product._id}`} className="cart-item-name">
                                                        {item.product.name}
                                                    </Link>
                                                    {item.size && <div className="cart-item-size">Size: <strong>{item.size}</strong></div>}
                                                    <button 
                                                        onClick={() => handleRemoveClick(item.product._id, item.size)}
                                                        className="cart-remove-btn"
                                                    >
                                                        <i className="fa-regular fa-trash-can"></i> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="cart-td" style={{ fontWeight: '600' }}>
                                            Rs. {activePrice.toLocaleString()}
                                        </td>
                                        <td className="cart-td">
                                            <div className="qty-controls" style={{ margin: '0 auto', width: 'fit-content' }}>
                                                <button 
                                                    onClick={() => handleQtyChange(item.product._id, item.quantity, false, item.size)}
                                                    className="qty-btn"
                                                >
                                                    -
                                                </button>
                                                <div className="qty-display">{item.quantity}</div>
                                                <button 
                                                    onClick={() => handleQtyChange(item.product._id, item.quantity, true, item.size)}
                                                    className="qty-btn"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="cart-td" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--brand-orange)' }}>
                                            Rs. {itemTotal.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="cart-summary-col">
                    <h3 className="selector-title" style={{ marginBottom: '25px', borderBottom: '1px solid #ddd', paddingBottom: '15px' }}>
                        Order Summary
                    </h3>
                    <div className="summary-row">
                        <span>Subtotal:</span>
                        <span style={{ fontWeight: '600' }}>Rs. {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                        <span>Shipping:</span>
                        <span style={{ color: 'var(--success-green)', fontWeight: '600' }}>Free</span>
                    </div>
                    <div className="summary-row summary-total">
                        <span>Total amount:</span>
                        <span>Rs. {subtotal.toLocaleString()}</span>
                    </div>

                    <button 
                        onClick={() => navigate('/checkout')}
                        className="btn-primary checkout-btn"
                    >
                        Proceed to Checkout
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Link to="/products" style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>
                            &larr; Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
