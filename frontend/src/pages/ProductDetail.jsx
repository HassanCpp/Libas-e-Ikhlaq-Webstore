import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../utils/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import ProductDetailSkeleton from '../components/ProductDetailSkeleton';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);
    const { addToCart, addToWishlist, removeFromWishlist, wishlistItems } = useContext(CartContext);

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Zoom state
    const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', transform: 'scale(1)' });

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomStyle({
            transformOrigin: `${x}% ${y}%`,
            transform: 'scale(1.8)'
        });
    };

    const handleMouseLeave = () => {
        setZoomStyle({
            transformOrigin: 'center center',
            transform: 'scale(1)'
        });
    };

    // Review Form State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    // Alerts State
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const fetchProductDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/products/${id}`);
            if (res.success) {
                setProduct(res.data);
                // Fetch reviews
                const reviewsRes = await api.get(`/products/${id}/reviews`);
                if (reviewsRes.success) {
                    setReviews(reviewsRes.data || []);
                }
                // Fetch related products
                const relatedRes = await api.get(`/products?category=${res.data.category}&limit=4`);
                if (relatedRes.success) {
                    setRelatedProducts((relatedRes.data || []).filter(p => p._id !== id));
                }
            }
        } catch (err) {
            console.error(err);
            triggerAlert('error', 'Failed to load product details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductDetails();
        setSelectedSize('');
        setQuantity(1);
    }, [id]);

    if (loading) {
        return <ProductDetailSkeleton />;
    }

    if (!product) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <h2>Product not found.</h2>
                <Link to="/products" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Back to Shop</Link>
            </div>
        );
    }

    const isClothing = product.category === 'kurta-pajama' || product.category === 'waistcoats';
    const isInWishlist = wishlistItems.some(item => item._id === product._id);

    const handleWishlistToggle = async () => {
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            if (isInWishlist) {
                await removeFromWishlist(product._id);
                triggerAlert('success', 'Product removed from wishlist.');
            } else {
                await addToWishlist(product._id);
                triggerAlert('success', 'Product added to wishlist.');
            }
        } catch (err) {
            triggerAlert('error', err.message);
        }
    };

    const handleAddToCartClick = async () => {
        if (!token) {
            // Store cart item intent in session/localStorage? Let's direct to login first.
            navigate('/login');
            return;
        }

        if (isClothing && !selectedSize) {
            triggerAlert('error', 'Please select a size first.');
            return;
        }

        // Validate stock
        if (isClothing) {
            const availableStock = product.sizes[selectedSize] || 0;
            if (availableStock < quantity) {
                triggerAlert('error', `Insufficient stock. Only ${availableStock} items left in size ${selectedSize}.`);
                return;
            }
        } else {
            if (product.stock < quantity) {
                triggerAlert('error', `Insufficient stock. Only ${product.stock} items left.`);
                return;
            }
        }

        try {
            await addToCart(product._id, selectedSize || null, quantity);
            triggerAlert('success', 'Successfully added to shopping bag.');
        } catch (err) {
            triggerAlert('error', err.message);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            navigate('/login');
            return;
        }
        if (!comment.trim()) {
            triggerAlert('error', 'Please write a comment.');
            return;
        }
        try {
            const res = await api.post(`/products/${product._id}/review`, { rating, comment });
            if (res.success) {
                triggerAlert('success', 'Thank you! Your review has been submitted.');
                setComment('');
                setRating(5);
                fetchProductDetails();
            }
        } catch (err) {
            triggerAlert('error', err.message);
        }
    };

    return (
        <div className="product-detail-page">
            <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />

            <div className="detail-container">
                <div 
                    className="detail-gallery"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ overflow: 'hidden', cursor: 'zoom-in' }}
                >
                    <img 
                        src={getImageUrl(product.image)} 
                        alt={product.name} 
                        className="detail-large-img" 
                        style={{ 
                            transition: zoomStyle.transform === 'scale(1)' ? 'transform 0.3s ease, transform-origin 0.3s ease' : 'none',
                            ...zoomStyle
                        }}
                    />
                </div>

                <div className="detail-info">
                    <span className="product-category">{product.category}</span>
                    <h1 className="detail-title">{product.name}</h1>
                    
                    <div className="product-rating" style={{ marginBottom: '20px' }}>
                        <i className="fa-solid fa-star"></i>
                        <span className="rating-text" style={{ fontSize: '15px' }}>{product.rating || '0.0'} ({reviews.length} reviews)</span>
                    </div>

                    <div className="detail-pricing">
                        {product.discountPrice && product.discountPrice < product.price ? (
                            <>
                                <span className="sale-price" style={{ color: 'var(--brand-orange)' }}>Rs. {product.discountPrice}</span>
                                <span className="original-price-strike" style={{ marginLeft: '15px', fontSize: '18px' }}>Rs. {product.price}</span>
                            </>
                        ) : (
                            <span>Rs. {product.price}</span>
                        )}
                    </div>

                    <p className="detail-description">{product.description || 'Premium material and craftsmanship.'}</p>

                    {isClothing && (
                        <div className="size-selector-section">
                            <h4 className="selector-title">Select Size:</h4>
                            <div className="size-buttons-container">
                                {['XS', 'S', 'M', 'L', 'XL'].map((sz) => {
                                    const sizeStock = product.sizes[sz] || 0;
                                    const isOutOfStock = sizeStock <= 0;
                                    return (
                                        <button
                                            key={sz}
                                            disabled={isOutOfStock}
                                            onClick={() => setSelectedSize(sz)}
                                            className={`size-select-btn ${selectedSize === sz ? 'selected' : ''}`}
                                        >
                                            {sz}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="qty-section">
                        <span className="selector-title" style={{ margin: 0 }}>Quantity:</span>
                        <div className="qty-controls">
                            <button
                                disabled={quantity <= 1}
                                onClick={() => setQuantity(q => q - 1)}
                                className="qty-btn"
                            >
                                -
                            </button>
                            <div className="qty-display">{quantity}</div>
                            <button
                                onClick={() => setQuantity(q => q + 1)}
                                className="qty-btn"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="detail-actions">
                        <button
                            onClick={handleAddToCartClick}
                            className="btn-primary btn-add-cart"
                            disabled={!isClothing && product.stock <= 0}
                        >
                            {!isClothing && product.stock <= 0 ? 'Out of Stock' : 'Add to Shopping Bag'}
                        </button>
                        <button
                            onClick={handleWishlistToggle}
                            className={`btn-wishlist-detail ${isInWishlist ? 'wishlist-active' : ''}`}
                        >
                            <i className={isInWishlist ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
                        </button>
                    </div>
                </div>
            </div>

            <section className="reviews-section">
                <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '30px' }}>Customer Reviews</h2>
                
                <div className="reviews-grid">
                    <div className="reviews-list-col">
                        {reviews.length === 0 ? (
                            <p style={{ color: '#777' }}>No reviews yet. Be the first to review this product!</p>
                        ) : (
                            reviews.map((rev) => (
                                <div key={rev._id} className="review-item">
                                    <div className="review-header">
                                        <span className="review-user">{rev.userName}</span>
                                        <span className="review-date">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="review-rating">
                                        {[...Array(5)].map((_, i) => (
                                            <i
                                                key={i}
                                                className={i < rev.rating ? 'fa-solid fa-star' : 'fa-regular fa-star'}
                                            ></i>
                                        ))}
                                    </div>
                                    <p className="review-comment">{rev.comment}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="reviews-form-col">
                        <h3 className="selector-title" style={{ marginBottom: '20px' }}>Write a Review</h3>
                        <form onSubmit={handleReviewSubmit}>
                            <div className="rating-select-container">
                                <span className="form-label" style={{ margin: 0 }}>Your Rating:</span>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <i
                                            key={star}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            className={`fa-star rating-star-input ${(hoverRating || rating) >= star ? 'fa-solid active' : 'fa-regular'}`}
                                        ></i>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Review Comment</label>
                                <textarea
                                    placeholder="Share your experience with this product..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="review-textarea"
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" className="btn-dark" style={{ width: '100%' }}>
                                Submit Review
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {relatedProducts.length > 0 && (
                <section className="products-section" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <h2 className="section-title">You May Also Like</h2>
                    <div className="product-grid">
                        {relatedProducts.map((p) => (
                            <div key={p._id} className="product-card">
                                {p.discountPrice && p.discountPrice < p.price && (
                                    <span className="product-badge">Sale</span>
                                )}
                                <div className="product-image-container">
                                    <Link to={`/products/${p._id}`}>
                                        <img src={getImageUrl(p.image)} alt={p.name} className="product-image" />
                                    </Link>
                                </div>
                                <div className="product-info">
                                    <span className="product-category">{p.category}</span>
                                    <h3 className="product-name">
                                        <Link to={`/products/${p._id}`}>{p.name}</Link>
                                    </h3>
                                    <div className="product-pricing">
                                        {p.discountPrice && p.discountPrice < p.price ? (
                                            <>
                                                <span className="sale-price">Rs. {p.discountPrice}</span>
                                                <span className="original-price-strike">Rs. {p.price}</span>
                                            </>
                                        ) : (
                                            <span>Rs. {p.price}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProductDetail;
