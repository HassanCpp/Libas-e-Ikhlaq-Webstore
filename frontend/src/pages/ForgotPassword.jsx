import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import Alert from '../components/Alert';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [submitting, setSubmitting] = useState(false);

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setSubmitting(true);
        try {
            const res = await api.post('/auth/forgot-password', { email: email.trim() });
            if (res.success) {
                triggerAlert('success', res.message || 'Password reset link sent to your email.');
                setEmail('');
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Error occurred while resetting password.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="split-auth-container">
            {/* LEFT COLUMN: BRANDED VISUAL */}
            <div 
                className="auth-image-column"
                style={{ backgroundImage: "url('/wool-blended.png')" }}
            >
                <div className="auth-image-overlay"></div>
                <div className="auth-image-content">
                    <h2>Libas-e-Ikhlaq</h2>
                    <p>Elevating everyday style with premium unstitched fabrics and signature fragrances.</p>
                </div>
            </div>

            {/* RIGHT COLUMN: FORM */}
            <div className="auth-form-column">
                {alertMessage && (
                    <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
                )}
                
                <Link to="/login" className="auth-back-link">
                    <i className="fa-solid fa-arrow-left"></i> Back to Login
                </Link>

                <div className="auth-header">
                    <h1>Reset Password</h1>
                    <p>Enter your email address and we will email you instructions to reset your password.</p>
                </div>

                <form onSubmit={handleFormSubmit}>
                    <div className="auth-form-group">
                        <label className="auth-form-label">Email Address</label>
                        <input
                            type="email"
                            placeholder="yourname@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-form-input"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="auth-btn-orange"
                    >
                        {submitting ? 'Sending instructions...' : 'Send Reset Instructions'}
                    </button>
                </form>

                <p className="auth-redirect-footer">
                    Remembered credentials? <Link to="/login" className="auth-orange-link">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
