import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { api, getImageUrl } from '../utils/api';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const { cartItems, wishlistItems } = useContext(CartContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const suggestionsRef = useRef(null);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out of your account?")) {
            logout();
            navigate('/login');
        }
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.trim().length < 2) {
                setSuggestions([]);
                return;
            }
            try {
                const res = await api.get(`/search-autocomplete?q=${encodeURIComponent(searchQuery)}`);
                if (res.success) {
                    setSuggestions(res.data || []);
                }
            } catch (err) {
                console.error(err);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (productId) => {
        setSearchQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        navigate(`/products/${productId}`);
    };

    const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const firstName = user && user.name ? user.name.split(' ')[0] : '';

    const isLinkActive = (path) => {
        if (path === '/') {
            return location.pathname === '/' && !location.search;
        }
        const currentUrl = location.pathname + location.search;
        return currentUrl === path;
    };

    return (
        <header className="new-header-container">
            {/* Top Row: Logo, Centered Brand Name, Right-aligned Actions & Search */}
            <div className="header-top-row">
                {/* Left: Brand Logo */}
                <div className="header-logo-section">
                    <Link to="/">
                        <img src="/logo.png" alt="Libas-e-Ikhlaq Logo" className="brand-logo-img" />
                    </Link>
                </div>

                {/* Center: Brand Identity */}
                <div className="header-brand-section">
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="brand-titles">
                            <span className="brand-urdu-script">لباس اخلاق</span>
                            <span className="brand-english-title">LIBAS-E-IKHLAQ</span>
                        </div>
                    </Link>
                </div>

                {/* Right: Search & Actions */}
                <div className="header-actions-section">
                    {/* Search Pill */}
                    <div className="header-search-box" ref={suggestionsRef}>
                        <form onSubmit={handleSearchSubmit} className="header-search-form">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                className="header-search-input"
                            />
                            <button type="submit" className="header-search-btn">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </button>
                        </form>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="header-suggestions-dropdown">
                                {suggestions.map((prod) => (
                                    <div
                                        key={prod._id}
                                        onClick={() => handleSuggestionClick(prod._id)}
                                        className="header-suggestion-item"
                                    >
                                        <img src={getImageUrl(prod.image)} alt={prod.name} className="header-suggestion-img" />
                                        <div className="header-suggestion-info">
                                            <span className="header-suggestion-name">{prod.name}</span>
                                            <span className="header-suggestion-price">
                                                {prod.discountPrice && prod.discountPrice < prod.price ? (
                                                    <>
                                                        <span className="sale-price">Rs. {prod.discountPrice}</span>
                                                        <span className="original-price-strike">Rs. {prod.price}</span>
                                                    </>
                                                ) : (
                                                    `Rs. ${prod.price}`
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Welcome message (left aligned on mobile) */}
                    {user && (
                        <span className="header-user-welcome-text">Hi, {firstName}!</span>
                    )}

                    {/* Group for all action buttons (right aligned on mobile) */}
                    <div className="header-icons-group">
                        {/* Wishlist Heart */}
                        <Link to="/wishlist" className="header-action-icon-link" title="Wishlist">
                            <i className="fa-regular fa-heart"></i>
                            {wishlistItems.length > 0 && <span className="header-action-badge">{wishlistItems.length}</span>}
                        </Link>

                        {/* If Admin, show Shield icon */}
                        {user && user.role === 'admin' && (
                            <Link to="/admin" className="header-action-icon-link" title="Admin Dashboard">
                                <i className="fa-solid fa-shield-halved"></i>
                            </Link>
                        )}

                        {/* Show Orders Box icon */}
                        {user && (
                            <Link to="/orders" className="header-action-icon-link" title="My Orders">
                                <i className="fa-solid fa-box"></i>
                            </Link>
                        )}

                        {/* Show Guest User or Logout icon */}
                        {user ? (
                            <button onClick={handleLogout} className="header-logout-btn" title="Logout">
                                <i className="fa-solid fa-right-from-bracket"></i>
                            </button>
                        ) : (
                            <Link to="/login" className="header-action-icon-link" title="Login / Register">
                                <i className="fa-regular fa-user"></i>
                            </Link>
                        )}

                        {/* Cart Icon */}
                        <Link to="/cart" className="header-action-icon-link header-cart-icon-container" title="Shopping Cart">
                            <i className="fa-solid fa-bag-shopping"></i>
                            {totalCartCount > 0 && <span className="header-action-badge header-badge-orange">{totalCartCount}</span>}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Navigation Links */}
            <nav className="header-nav-bar">
                <ul className="header-nav-list">
                    <li className="header-nav-item">
                        <Link to="/" className={isLinkActive('/') ? 'header-nav-link active' : 'header-nav-link'}>
                            Home
                        </Link>
                    </li>
                    <li className="header-nav-item">
                        <Link to="/products?category=unstitched" className={isLinkActive('/products?category=unstitched') ? 'header-nav-link active' : 'header-nav-link'}>
                            Unstitched
                        </Link>
                    </li>
                    <li className="header-nav-item">
                        <Link to="/products?category=kurta-pajama" className={isLinkActive('/products?category=kurta-pajama') ? 'header-nav-link active' : 'header-nav-link'}>
                            Kurta Pajama
                        </Link>
                    </li>
                    <li className="header-nav-item">
                        <Link to="/products?category=waistcoats" className={isLinkActive('/products?category=waistcoats') ? 'header-nav-link active' : 'header-nav-link'}>
                            Waistcoats
                        </Link>
                    </li>
                    <li className="header-nav-item">
                        <Link to="/products?category=fragrance" className={isLinkActive('/products?category=fragrance') ? 'header-nav-link active' : 'header-nav-link'}>
                            Fragrance
                        </Link>
                    </li>
                    <li className="header-nav-item">
                        <Link to="/products?category=accessories" className={isLinkActive('/products?category=accessories') ? 'header-nav-link active' : 'header-nav-link'}>
                            Accessories
                        </Link>
                    </li>
                    <li className="header-nav-item">
                        <Link to="/contact-us" className={isLinkActive('/contact-us') ? 'header-nav-link active' : 'header-nav-link'}>
                            Contact Us
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;
