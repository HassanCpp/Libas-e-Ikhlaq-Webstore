import React from 'react';
import { NavLink } from 'react-router-dom';

const Nav = () => {
    const categories = [
        { name: 'Unstitched Fabric', path: '/products?category=unstitched' },
        { name: 'Kurta Pajama', path: '/products?category=kurta-pajama' },
        { name: 'Waistcoats', path: '/products?category=waistcoats' },
        { name: 'Fragrances', path: '/products?category=fragrance' },
        { name: 'Accessories', path: '/products?category=accessories' },
        { name: 'All Products', path: '/products' },
        { name: 'Contact Us', path: '/contact-us' }
    ];

    return (
        <nav className="main-nav">
            <ul className="nav-list">
                {categories.map((cat, idx) => (
                    <li key={idx} className="nav-item">
                        <NavLink
                            to={cat.path}
                            className={({ isActive }) => 
                                isActive ? 'nav-link active-category' : 'nav-link'
                            }
                        >
                            {cat.name}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Nav;
