import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminSidebar = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Products Inventory', path: '/admin', icon: 'fa-solid fa-boxes-stacked' },
        { name: 'Customer Orders', path: '/admin/orders', icon: 'fa-solid fa-cart-shopping' },
        { name: 'Sales Analytics', path: '/admin/analytics', icon: 'fa-solid fa-chart-line' },
        { name: 'User Management', path: '/admin/users', icon: 'fa-solid fa-users-gear' },
        { name: 'Review Moderation', path: '/admin/reviews', icon: 'fa-solid fa-comment-dots' }
    ];

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            logout();
            navigate('/login');
        }
    };

    return (
        <aside className="admin-sidebar">
            <div className="admin-logo">
                <Link to="/" style={{ color: 'inherit' }}>
                    ADMIN PANEL
                </Link>
            </div>
            
            <ul className="admin-menu-list">
                {menuItems.map((item, idx) => (
                    <li key={idx}>
                        <NavLink
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) => 
                                isActive ? 'admin-menu-link active' : 'admin-menu-link'
                            }
                        >
                            <i className={item.icon}></i>
                            {item.name}
                        </NavLink>
                    </li>
                ))}
                
                <li style={{ marginTop: '50px', borderTop: '1px solid #222' }}>
                    <Link to="/" className="admin-menu-link">
                        <i className="fa-solid fa-store"></i>
                        Back to Store
                    </Link>
                </li>

                <li>
                    <button 
                        onClick={handleLogout} 
                        className="admin-menu-link" 
                        style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                    >
                        <i className="fa-solid fa-power-off" style={{ color: 'var(--error-red)' }}></i>
                        Logout Admin
                    </button>
                </li>
            </ul>
        </aside>
    );
};

export default AdminSidebar;
