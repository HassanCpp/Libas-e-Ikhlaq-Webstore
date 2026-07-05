import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [subSuccess, setSubSuccess] = useState('');
    const [subError, setSubError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        setSubSuccess('');
        setSubError('');
        
        if (!email.trim()) {
            setSubError('Email is required.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/newsletter/subscribe', { email: email.trim() });
            if (res.success) {
                setSubSuccess(res.message || 'Thank you for subscribing!');
                setEmail('');
            } else {
                setSubError(res.message || 'Subscription failed.');
            }
        } catch (err) {
            setSubError(err.message || 'Newsletter subscription failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="footer-wrapper">
            {/* 1. NEWSLETTER BANNER SECTION (Full Width) */}
            <section className="newsletter-section">
                <div className="newsletter-content">
                    <h2>JOIN THE CLUB</h2>
                    <p>Subscribe to our newsletter to receive exclusive offers, early access to new collections, and 10% off your first unstitched order.</p>
                    
                    <form onSubmit={handleSubscribe} className="newsletter-form">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="newsletter-input"
                            required
                        />
                        <button type="submit" disabled={submitting} className="newsletter-btn">
                            {submitting ? 'Subscribing...' : 'SUBSCRIBE'}
                        </button>
                    </form>
                    {subSuccess && <p className="newsletter-msg-success">{subSuccess}</p>}
                    {subError && <p className="newsletter-msg-error">{subError}</p>}
                </div>
            </section>

            {/* 2. FOOTER SECTION (Full Width) */}
            <footer className="main-footer">
                <div className="footer-top">
                    {/* Column 1: Brand Info */}
                    <div className="footer-col">
                        <h3>LIBAS-E-IKHLAQ</h3>
                        <p className="footer-desc">
                            Elevating everyday style with premium unstitched fabrics, signature fragrances, and curated accessories for the modern gentleman.
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="footer-col">
                        <h3>QUICK LINKS</h3>
                        <ul>
                            <li><Link to="/products?category=unstitched">Unstitched Fabric</Link></li>
                            <li><Link to="/products?category=kurta-pajama">Kurta Pajama</Link></li>
                            <li><Link to="/products?category=waistcoats">Waistcoats</Link></li>
                            <li><Link to="/products?category=fragrance">Fragrance</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Customer Care */}
                    <div className="footer-col">
                        <h3>CUSTOMER CARE</h3>
                        <ul>
                            <li><Link to="/contact-us">Contact Us</Link></li>
                            <li><a href="#">Shipping & Delivery</a></li>
                            <li><a href="#">Returns & Exchanges</a></li>
                            <li><a href="#">FAQs</a></li>
                        </ul>
                    </div>

                    {/* Column 4: Contact Info */}
                    <div className="footer-col">
                        <h3>GET IN TOUCH</h3>
                        <div className="contact-item">
                            <i className="fa-solid fa-location-dot"></i>
                            <span>Lahore, Pakistan</span>
                        </div>
                        <div className="contact-item">
                            <i className="fa-solid fa-envelope"></i>
                            <span>support@libaseikhlaq.com</span>
                        </div>
                        <div className="contact-item">
                            <i className="fa-solid fa-phone"></i>
                            <span>+92 300 1234567</span>
                        </div>

                        {/* Social Icons inside small circles */}
                        <div className="social-icons-circle">
                            <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
                            <a href="#" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp"></i></a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Libas-e-Ikhlaq Store. All Rights Reserved.</p>
                    <p className="footer-made-by">Bespoke Eastern Apparel & Accessories</p>
                </div>
            </footer>
        </div>
    );
};

export default Footer;
