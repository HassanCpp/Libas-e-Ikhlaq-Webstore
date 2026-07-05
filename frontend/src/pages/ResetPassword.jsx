import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import Alert from '../components/Alert';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [submitting, setSubmitting] = useState(false);

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            triggerAlert('error', 'Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            if (res.success) {
                navigate('/login', { state: { resetSuccess: true } });
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Reset link expired or invalid.');
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
                    <h1>Choose New Password</h1>
                    <p>Please enter your new password below.</p>
                </div>

                <form onSubmit={handleFormSubmit}>
                    <div className="auth-form-group">
                        <label className="auth-form-label">New Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-form-input"
                            required
                        />
                    </div>

                    <div className="auth-form-group">
                        <label className="auth-form-label">Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="Repeat new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="auth-form-input"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="auth-btn-black"
                    >
                        {submitting ? 'Updating password...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
