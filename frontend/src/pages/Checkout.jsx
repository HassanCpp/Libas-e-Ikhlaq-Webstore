import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { api } from '../utils/api';
import Alert from '../components/Alert';

const Checkout = () => {
    const { cartItems, subtotal, fetchCartAndWishlist } = useContext(CartContext);
    const navigate = useNavigate();

    // Form inputs state
    const [fullName, setFullName] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [phone, setPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    
    // Credit card state (if Card is selected)
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    // Alerts State
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [submitting, setSubmitting] = useState(false);

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/cart');
        }
    }, [cartItems]);

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode.trim()) return;
        try {
            const res = await api.post('/checkout/apply-coupon', {
                couponCode: couponCode.trim(),
                subtotal: subtotal
            });
            if (res.success) {
                setCouponApplied(res.couponCode);
                setDiscountAmount(res.discountAmount);
                triggerAlert('success', `Coupon "${res.couponCode}" applied successfully! Rs. ${res.discountAmount} discounted.`);
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Invalid coupon code.');
        }
    };

    const handleRemoveCoupon = () => {
        setCouponApplied(null);
        setDiscountAmount(0);
        setCouponCode('');
        triggerAlert('success', 'Coupon removed.');
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        
        // Manual validation before API hit
        if (!fullName.trim() || !addressLine.trim() || !city.trim() || !postalCode.trim() || !phone.trim()) {
            triggerAlert('error', 'All shipping fields are required.');
            return;
        }

        if (paymentMethod === 'Card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
            triggerAlert('error', 'Please provide credit card billing details.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                items: cartItems.map(item => ({
                    productId: item.product._id,
                    quantity: item.quantity,
                    size: item.size || null
                })),
                shippingAddress: {
                    fullName: fullName.trim(),
                    addressLine: addressLine.trim(),
                    city: city.trim(),
                    postalCode: postalCode.trim(),
                    phone: phone.trim()
                },
                paymentMethod,
                couponCode: couponApplied
            };

            const res = await api.post('/orders', payload);
            if (res.success) {
                // Clear cart in state
                await fetchCartAndWishlist();
                navigate(`/orders/${res.data._id}`);
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Failed to submit order.');
        } finally {
            setSubmitting(false);
        }
    };

    const finalTotal = subtotal - discountAmount;

    return (
        <div className="checkout-page-container">
            <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '30px' }}>Secure Checkout</h1>

            <div className="checkout-layout">
                <div className="checkout-form-col">
                    <form onSubmit={handleOrderSubmit}>
                        <h3 className="selector-title" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                            Shipping Details
                        </h3>
                        
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter recipient full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address Line</label>
                            <input
                                type="text"
                                placeholder="House / Apartment number, Street, Area"
                                value={addressLine}
                                onChange={(e) => setAddressLine(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div className="form-group" style={{ flexGrow: 1 }}>
                                <label className="form-label">City</label>
                                <input
                                    type="text"
                                    placeholder="City (e.g. Lahore)"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ flexGrow: 1 }}>
                                <label className="form-label">Postal Code</label>
                                <input
                                    type="text"
                                    placeholder="Postal Code"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="text"
                                placeholder="Mobile number (e.g. 03001234567)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <h3 className="selector-title" style={{ marginTop: '35px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                            Payment Method
                        </h3>

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="COD"
                                    checked={paymentMethod === 'COD'}
                                    onChange={() => setPaymentMethod('COD')}
                                />
                                Cash On Delivery (COD)
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="Card"
                                    checked={paymentMethod === 'Card'}
                                    onChange={() => setPaymentMethod('Card')}
                                />
                                Credit / Debit Card
                            </label>
                        </div>

                        {paymentMethod === 'Card' && (
                            <div className="address-box" style={{ background: '#fcfcfc', marginBottom: '30px' }}>
                                <div className="form-group">
                                    <label className="form-label">Card Number</label>
                                    <input
                                        type="text"
                                        placeholder="16-digit card number"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div className="form-group" style={{ flexGrow: 1 }}>
                                        <label className="form-label">Expiry Date</label>
                                        <input
                                            type="text"
                                            placeholder="MM / YY"
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(e.target.value)}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group" style={{ flexGrow: 1 }}>
                                        <label className="form-label">CVV</label>
                                        <input
                                            type="password"
                                            placeholder="3-digit CVV"
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value)}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary"
                            style={{ width: '100%', padding: '18px 0', fontSize: '15px', letterSpacing: '1px' }}
                        >
                            {submitting ? 'Placing Order...' : `PLACE ORDER - RS. ${finalTotal.toLocaleString()}`}
                        </button>
                    </form>
                </div>

                <div className="checkout-summary-col">
                    <h3 className="selector-title" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                        Your Order
                    </h3>

                    {cartItems.map((item, idx) => {
                        const activePrice = (item.product.discountPrice && item.product.discountPrice < item.product.price) 
                            ? item.product.discountPrice 
                            : item.product.price;
                        return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
                                <span>
                                    {item.product.name} {item.size && `(${item.size})`} <strong>x {item.quantity}</strong>
                                </span>
                                <span style={{ fontWeight: '600' }}>Rs. {(activePrice * item.quantity).toLocaleString()}</span>
                            </div>
                        );
                    })}

                    <div className="summary-row" style={{ marginTop: '25px' }}>
                        <span>Subtotal:</span>
                        <span>Rs. {subtotal.toLocaleString()}</span>
                    </div>

                    {discountAmount > 0 && (
                        <div className="summary-row" style={{ color: 'var(--brand-orange)' }}>
                            <span>Discount:</span>
                            <span>- Rs. {discountAmount.toLocaleString()}</span>
                        </div>
                    )}

                    <div className="summary-row">
                        <span>Shipping:</span>
                        <span style={{ color: 'var(--success-green)', fontWeight: '600' }}>Free</span>
                    </div>

                    <div className="summary-row summary-total" style={{ fontSize: '16px' }}>
                        <span>Total Paid:</span>
                        <span>Rs. {finalTotal.toLocaleString()}</span>
                    </div>

                    <div className="coupon-section">
                        <h4 className="selector-title" style={{ fontSize: '13px', marginBottom: '12px' }}>Have a Promo Coupon?</h4>
                        {!couponApplied ? (
                            <form onSubmit={handleApplyCoupon} className="coupon-form">
                                <input
                                    type="text"
                                    placeholder="Enter Coupon Code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    className="form-input coupon-input"
                                />
                                <button type="submit" className="btn-dark" style={{ padding: '0 20px' }}>Apply</button>
                            </form>
                        ) : (
                            <div className="coupon-success-tag">
                                <span>Coupon <strong>{couponApplied}</strong> Applied!</span>
                                <button onClick={handleRemoveCoupon} className="coupon-remove-btn">Remove</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
