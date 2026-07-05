import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminHeader = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Products Inventory', path: '/admin' },
        { name: 'Customer Orders', path: '/admin/orders' },
        { name: 'Sales & Inventory Analytics', path: '/admin/analytics' },
        { name: 'Customer Directory', path: '/admin/users' },
        { name: 'Reviews Moderation', path: '/admin/reviews' }
    ];

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out of the Admin panel?")) {
            logout();
            navigate('/login');
        }
    };

    const adminName = user ? user.name : 'Admin';

    return (
        <div className="admin-nav-wrapper">
            {/* TOP BAR */}
            <header className="admin-top-bar">
                <div className="admin-brand-col">
                    <img src="/logo.png" alt="Libas-e-Ikhlaq Logo" className="admin-header-logo" />
                    <div className="admin-brand-texts">
                        <span className="admin-brand-urdu">لباس اخلاق</span>
                        <span className="admin-brand-english">
                            LIBAS-E-IKHLAQ <span className="admin-tag-orange">ADMIN</span>
                        </span>
                    </div>
                </div>

                <div className="admin-user-controls">
                    <span className="admin-welcome-text">HI, {adminName.toUpperCase()}</span>
                    
                    <Link to="/" className="admin-view-store-btn">
                        View Store
                    </Link>

                    <button 
                        onClick={handleLogout} 
                        className="admin-logout-icon-btn" 
                        aria-label="Logout"
                        title="Logout Admin"
                    >
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </header>

            {/* HORIZONTAL TABS MENU */}
            <nav className="admin-tabs-nav">
                <ul className="admin-tabs-list">
                    {menuItems.map((item, idx) => (
                        <li key={idx} className="admin-tab-item">
                            <NavLink
                                to={item.path}
                                end={item.path === '/admin'}
                                className={({ isActive }) => 
                                    isActive ? 'admin-tab-link active' : 'admin-tab-link'
                                }
                            >
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default AdminHeader;
