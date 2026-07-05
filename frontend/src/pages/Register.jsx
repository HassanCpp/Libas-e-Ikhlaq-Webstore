import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import Alert from '../components/Alert';

const Register = () => {
    const navigate = useNavigate();

    const [name, setName] = useState('');
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
        
        if (!name.trim() || !email.trim() || !password) {
            triggerAlert('error', 'All fields are required.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password
            });
            if (res.success) {
                navigate('/login', { state: { registered: true, email: email.trim() } });
            }
        } catch (err) {
            triggerAlert('error', err.message || 'Registration failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="split-auth-container">
            {/* LEFT COLUMN: FORM */}
            <div className="auth-form-column">
                {alertMessage && (
                    <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
                )}
                
                <Link to="/" className="auth-back-link">
                    <i className="fa-solid fa-arrow-left"></i> Back to Store
                </Link>

                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Please fill in the details below to register.</p>
                </div>

                <form onSubmit={handleFormSubmit}>
                    <div className="auth-form-group">
                        <label className="auth-form-label">Full Name</label>
                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="auth-form-input"
                            required
                        />
                    </div>

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
                        <label className="auth-form-label">Password</label>
                        <input
                            type="password"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-form-input"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="auth-btn-orange"
                    >
                        {submitting ? 'Creating account...' : 'Register Now'}
                    </button>
                </form>

                <p className="auth-redirect-footer">
                    Already have an account? <Link to="/login" className="auth-orange-link">Log In</Link>
                </p>
            </div>

            {/* RIGHT COLUMN: BRANDED TEXT OVER MODEL BACKGROUND */}
            <div 
                className="auth-image-column"
                style={{ backgroundImage: "url('/maroonkurta.png')" }}
            >
                <div className="auth-image-overlay"></div>
                <div className="auth-image-content">
                    <h2>Join the Club</h2>
                    <p>Create an account to track your orders, save your wishlist, and check out faster.</p>
                </div>
            </div>
        </div>
    );
};

export default Register;
