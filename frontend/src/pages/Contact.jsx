import React from 'react';

const Contact = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px' }}>
            <h1 className="section-title">Contact Us</h1>
            
            <div className="address-box" style={{ padding: '40px', background: '#fafafa', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '25px', color: 'var(--brand-orange)' }}>
                    Get In Touch With Libas-e-Ikhlaq
                </h3>
                
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#555', marginBottom: '30px' }}>
                    We value our customers' feedback and inquiries. If you have questions about order statuses, bulk fabric acquisitions, sizing advice, or shipping options, feel free to reach out to our customer care center.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <i className="fa-solid fa-phone" style={{ fontSize: '18px', color: 'var(--brand-orange)' }}></i>
                        <div>
                            <strong style={{ display: 'block', fontSize: '14px', textTransform: 'uppercase', color: '#777' }}>Helpline Support</strong>
                            <span style={{ fontSize: '16px', fontWeight: '600' }}>+92 (300) 123-4567</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <i className="fa-solid fa-envelope" style={{ fontSize: '18px', color: 'var(--brand-orange)' }}></i>
                        <div>
                            <strong style={{ display: 'block', fontSize: '14px', textTransform: 'uppercase', color: '#777' }}>Email Assistance</strong>
                            <span style={{ fontSize: '16px', fontWeight: '600' }}>support@libaseikhlaq.com</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <i className="fa-solid fa-location-dot" style={{ fontSize: '18px', color: 'var(--brand-orange)' }}></i>
                        <div>
                            <strong style={{ display: 'block', fontSize: '14px', textTransform: 'uppercase', color: '#777' }}>Flagship Store Outlet</strong>
                            <span style={{ fontSize: '15px', fontWeight: '600' }}>128-B, Gulberg III, Lahore, Pakistan</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
