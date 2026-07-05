import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [submitting, setSubmitting] = useState(false);

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            triggerAlert('error', 'Please enter email and password.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await login(email.trim(), password);
            if (res.success) {
                if (res.user && res.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Login credentials incorrect.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="split-auth-container">
            {/* LEFT COLUMN: BRANDED TEXT OVER FABRIC BACKGROUND */}
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
                
                <Link to="/" className="auth-back-link">
                    <i className="fa-solid fa-arrow-left"></i> Back to Store
                </Link>

                <div className="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Sign in to access your account and saved items.</p>
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

                    <div className="auth-form-group">
                        <label className="auth-form-label">
                            Password
                            <Link to="/forgot-password" style={{ color: 'var(--brand-orange)', textTransform: 'none', fontWeight: '500', fontSize: '13px', textDecoration: 'none' }}>
                                Forgot Password?
                            </Link>
                        </label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-form-input"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="auth-btn-black"
                    >
                        {submitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-redirect-footer">
                    Don't have an account? <Link to="/register" className="auth-orange-link">Register Now</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
