import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api, getImageUrl } from '../utils/api';
import { CartContext } from '../context/CartContext';
import Alert from '../components/Alert';
import SkeletonLoader from '../components/SkeletonLoader';

const Catalog = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    
    // Parse queries from location
    const getQueryParam = (name) => {
        const params = new URLSearchParams(location.search);
        return params.get(name) || '';
    };

    const currentCategory = getQueryParam('category');
    const currentSearch = getQueryParam('search');
    const currentSort = getQueryParam('sort');
    const currentMinPrice = getQueryParam('minPrice');
    const currentMaxPrice = getQueryParam('maxPrice');
    const currentPage = parseInt(getQueryParam('page')) || 1;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    // Sidebar local inputs
    const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
    const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

    // Filters sidebar toggle state
    const [showFilters, setShowFilters] = useState(false);

    // Quick add to cart states
    const [addingId, setAddingId] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    useEffect(() => {
        setMinPriceInput(currentMinPrice);
        setMaxPriceInput(currentMaxPrice);
    }, [currentMinPrice, currentMaxPrice]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(location.search);
            // Default limit 8 for catalog
            if (!queryParams.get('limit')) {
                queryParams.set('limit', '8');
            }
            const res = await api.get(`/products?${queryParams.toString()}`);
            if (res.success) {
                setProducts(res.data || []);
                setTotalPages(res.totalPages || 1);
                setTotalProducts(res.totalProducts || 0);
            }
        } catch (err) {
            console.error('Error fetching catalog:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [location.search]);

    const updateQueryParams = (newParams) => {
        const params = new URLSearchParams(location.search);
        Object.keys(newParams).forEach(key => {
            if (newParams[key] === null || newParams[key] === '') {
                params.delete(key);
            } else {
                params.set(key, newParams[key]);
            }
        });
        // Reset page to 1 on filter updates unless specifically setting page
        if (!newParams.hasOwnProperty('page')) {
            params.delete('page');
        }
        navigate(`/products?${params.toString()}`);
    };

    const handleCategoryClick = (category) => {
        updateQueryParams({ category });
        setShowFilters(false); // Close sidebar on filter click
    };

    const handleSortChange = (e) => {
        updateQueryParams({ sort: e.target.value });
    };

    const handlePriceFilterSubmit = (e) => {
        e.preventDefault();
        updateQueryParams({
            minPrice: minPriceInput,
            maxPrice: maxPriceInput
        });
        setShowFilters(false); // Close sidebar on filter click
    };

    const handleClearFilters = () => {
        setMinPriceInput('');
        setMaxPriceInput('');
        setShowFilters(false);
        navigate('/products');
    };

    const handleQuickAdd = async (e, product) => {
        e.preventDefault();
        setAddingId(product._id);
        try {
            await addToCart(product._id, null, 1);
            triggerAlert('success', `"${product.name}" added to bag successfully!`);
        } catch (err) {
            triggerAlert('error', err.message || 'Failed to add item to bag.');
        } finally {
            setAddingId(null);
        }
    };

    const categories = [
        { name: 'All Categories', key: '' },
        { name: 'Unstitched Fabric', key: 'unstitched' },
        { name: 'Kurta Pajama', key: 'kurta-pajama' },
        { name: 'Waistcoats', key: 'waistcoats' },
        { name: 'Fragrances', key: 'fragrance' },
        { name: 'Accessories', key: 'accessories' }
    ];

    return (
        <div className="catalog-container">
            {alertMessage && (
                <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
            )}

            {/* Background Overlay */}
            {showFilters && (
                <div className="sidebar-overlay" onClick={() => setShowFilters(false)}></div>
            )}

            {/* Sidebar drawer */}
            <aside className={`catalog-sidebar ${showFilters ? 'active' : ''}`}>
                <div className="sidebar-close-header">
                    <h3>Filters</h3>
                    <button onClick={() => setShowFilters(false)} className="close-btn-sidebar">&times;</button>
                </div>

                <div className="filter-section">
                    <h3 className="filter-title">Categories</h3>
                    <ul className="filter-list">
                        {categories.map((cat, idx) => (
                            <li key={idx} className="filter-item">
                                <button
                                    onClick={() => handleCategoryClick(cat.key)}
                                    className={`filter-btn-sidebar ${currentCategory === cat.key ? 'active' : ''}`}
                                >
                                    {cat.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="filter-section">
                    <h3 className="filter-title">Price Range</h3>
                    <form onSubmit={handlePriceFilterSubmit}>
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPriceInput}
                                onChange={(e) => setMinPriceInput(e.target.value)}
                                className="price-input-box"
                            />
                            <span>to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPriceInput}
                                onChange={(e) => setMaxPriceInput(e.target.value)}
                                className="price-input-box"
                            />
                        </div>
                        <button type="submit" className="btn-dark" style={{ width: '100%', padding: '10px 0', fontSize: '13px' }}>
                            Apply Price
                        </button>
                    </form>
                </div>

                {(currentCategory || currentSearch || currentMinPrice || currentMaxPrice || currentSort) && (
                    <button onClick={handleClearFilters} className="btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: '13px', marginTop: '10px' }}>
                        Clear All Filters
                    </button>
                )}
            </aside>

            <main className="catalog-main">
                <div className="catalog-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* Toggle filters icon button */}
                        <button onClick={() => setShowFilters(true)} className="btn-toggle-filters">
                            <i className="fa-solid fa-sliders"></i> <span>Filter Products</span>
                        </button>
                        <div className="catalog-results-count">
                            Showing <strong>{products.length}</strong> of <strong>{totalProducts}</strong> products
                            {currentSearch && ` matching "${currentSearch}"`}
                        </div>
                    </div>
                    
                    <div className="catalog-sort">
                        <select value={currentSort} onChange={handleSortChange} className="sort-dropdown">
                            <option value="">Default Sorting</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <SkeletonLoader count={8} />
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', color: '#777' }}>
                        No products found matching your criteria.
                    </div>
                ) : (
                    <>
                        <div className="product-grid">
                            {products.map((product) => {
                                const isSizedProduct = product.category === 'kurta-pajama' || product.category === 'waistcoats';
                                return (
                                    <div key={product._id} className="product-card">
                                        {product.discountPrice && product.discountPrice < product.price && (
                                            <span className="product-badge">Sale</span>
                                        )}
                                        <div className="product-image-container">
                                            <Link to={`/products/${product._id}`}>
                                                <img src={getImageUrl(product.image)} alt={product.name} className="product-image" />
                                            </Link>
                                        </div>
                                        <div className="product-info" style={{ paddingBottom: '10px' }}>
                                            <span className="product-category">{product.category}</span>
                                            <h3 className="product-name">
                                                <Link to={`/products/${product._id}`}>{product.name}</Link>
                                            </h3>
                                            <div className="product-rating">
                                                <i className="fa-solid fa-star"></i>
                                                <span className="rating-text">{product.rating || '0.0'} ({product.reviewsCount || 0})</span>
                                            </div>
                                            <div className="product-pricing">
                                                {product.discountPrice && product.discountPrice < product.price ? (
                                                    <>
                                                        <span className="sale-price">Rs. {product.discountPrice}</span>
                                                        <span className="original-price-strike">Rs. {product.price}</span>
                                                    </>
                                                ) : (
                                                    <span>Rs. {product.price}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quick Add to Bag / Select Size button */}
                                        {isSizedProduct ? (
                                            <button 
                                                className="product-card-btn select-size-btn"
                                                onClick={() => navigate(`/products/${product._id}`)}
                                            >
                                                <i className="fa-solid fa-arrows-to-eye"></i> Select Size
                                            </button>
                                        ) : (
                                            <button 
                                                className="product-card-btn"
                                                onClick={(e) => handleQuickAdd(e, product)}
                                                disabled={addingId === product._id}
                                            >
                                                {addingId === product._id ? (
                                                    <>
                                                        <i className="fa-solid fa-spinner fa-spin"></i> Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-bag-shopping"></i> Add to Bag
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => updateQueryParams({ page: currentPage - 1 })}
                                    className="page-btn"
                                >
                                    &laquo;
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => updateQueryParams({ page: i + 1 })}
                                        className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => updateQueryParams({ page: currentPage + 1 })}
                                    className="page-btn"
                                >
                                    &raquo;
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Catalog;
