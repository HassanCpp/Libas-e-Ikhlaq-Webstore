import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../utils/api';
import { CartContext } from '../context/CartContext';
import Alert from '../components/Alert';

const Home = () => {
    const { addToCart } = useContext(CartContext);
    const [products, setProducts] = useState([]);
    const [specialOffers, setSpecialOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    // Quick add state
    const [addingId, setAddingId] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
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

    const slides = [
        {
            title: 'WINTER CLEARANCE SALE',
            desc: 'FLAT 25% & 50% OFF on Selected Items',
            action: 'Shop The Sale',
            path: '/products?sort=price-asc',
            class: 'slide-1'
        },
        {
            title: "THE SPRING / SUMMER '26 EDIT",
            desc: 'Step into the new season with our lightweight, breathable fabrics.',
            action: 'Explore New Arrivals',
            path: '/products?category=unstitched',
            class: 'slide-2'
        },
        {
            title: 'MASTER THE ART OF BESPOKE',
            desc: 'Premium Egyptian cottons and wash-and-wear fabrics.',
            action: 'Shop Unstitched',
            path: '/products?category=unstitched',
            class: 'slide-3'
        },
        {
            title: 'LEAVE A LASTING IMPRESSION',
            desc: "Complete your attire with our signature men's fragrances.",
            action: 'Discover Fragrances',
            path: '/products?category=fragrance',
            class: 'slide-4'
        }
    ];

    useEffect(() => {
        const fetchHomeData = async () => {
            setLoading(true);
            
            // 1. Fetch New Arrivals
            try {
                const newArrivalsRes = await api.get('/products?limit=8');
                if (newArrivalsRes && newArrivalsRes.success) {
                    setProducts(newArrivalsRes.data || []);
                }
            } catch (err) {
                console.error("Failed to load new arrivals:", err);
            }

            // 2. Fetch Special Offers
            try {
                const specialOffersRes = await api.get('/featured-offers');
                if (specialOffersRes && specialOffersRes.success) {
                    setSpecialOffers(specialOffersRes.data || []);
                }
            } catch (err) {
                console.error("Failed to load special offers:", err);
            }

            setLoading(false);
        };
        fetchHomeData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    return (
        <div className="home-page">
            {alertMessage && (
                <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
            )}

            <section className="info-hero">
                <div className="info-hero-left">
                    <p className="info-hero-desc">
                        Discover our premium range of unstitched fabrics, signature fragrances, and curated accessories designed to elevate your everyday style.
                    </p>
                    <button onClick={() => navigate('/products')} className="info-hero-btn">
                        View Collections
                    </button>
                </div>
                <div className="info-hero-right">
                    <h1 className="info-hero-urdu" dir="rtl">لباس جو بنے آپ کی شناخت</h1>
                </div>
            </section>

            <section className="carousel-section">
                <div 
                    className="carousel-wrapper" 
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.map((slide, idx) => (
                        <div key={idx} className={`carousel-slide ${slide.class}`}>
                            <div className="carousel-content">
                                <h2>{slide.title}</h2>
                                <p>{slide.desc}</p>
                                <button onClick={() => navigate(slide.path)} className="btn-dark">
                                    {slide.action}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="carousel-dots">
                    {slides.map((_, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => setCurrentSlide(idx)}
                            className={`dot ${currentSlide === idx ? 'active' : ''}`}
                        ></div>
                    ))}
                </div>
            </section>

            {/* NEW ARRIVALS */}
            <section className="products-section">
                <h2 className="section-title">NEW ARRIVALS</h2>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading products...</div>
                ) : (
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

                                    {/* Quick add / select size button */}
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
                )}
            </section>

            {/* SPECIAL OFFERS */}
            <section className="products-section" style={{ backgroundColor: '#fcfcfc', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                <h2 className="section-title">SPECIAL OFFERS</h2>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading offers...</div>
                ) : (
                    <div className="product-grid">
                        {specialOffers.map((product) => {
                            const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
                            const discountPct = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
                            const isSizedProduct = product.category === 'kurta-pajama' || product.category === 'waistcoats';
                            return (
                                <div key={product._id} className="product-card">
                                    {hasDiscount && (
                                        <span className="product-badge">SAVE {discountPct}%</span>
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
                                            {hasDiscount ? (
                                                <>
                                                    <span className="sale-price">Rs. {product.discountPrice}</span>
                                                    <span className="original-price-strike">Rs. {product.price}</span>
                                                </>
                                            ) : (
                                                <span>Rs. {product.price}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick add / select size button */}
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
                )}
            </section>

            {/* WHAT OUR CLIENTS SAY */}
            <section className="testimonials-section">
                <h2>WHAT OUR CLIENTS SAY</h2>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <div className="stars">
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                        </div>
                        <p className="quote">"The premium Egyptian cotton is exactly as described. The fabric feels incredibly soft and drapes perfectly after tailoring. Highly recommended."</p>
                        <p className="customer-name">- Ahmed R.</p>
                    </div>

                    <div className="testimonial-card">
                        <div className="stars">
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                        </div>
                        <p className="quote">"I ordered the wash-and-wear unstitched fabric for daily office use. The quality is outstanding and the delivery was very prompt."</p>
                        <p className="customer-name">- Salman T.</p>
                    </div>

                    <div className="testimonial-card">
                        <div className="stars">
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star"></i>
                            <i className="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <p className="quote">"Oud E Khaas has become my new signature scent. It lasts all day and has a very rich, traditional profile without being overpowering."</p>
                        <p className="customer-name">- Usman K.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
