import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import Alert from '../components/Alert';
import { getImageUrl } from '../utils/api';

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist, addToCart } = useContext(CartContext);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const triggerAlert = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
    };

    const handleRemove = async (productId) => {
        try {
            await removeFromWishlist(productId);
            triggerAlert('success', 'Product removed from wishlist.');
        } catch (err) {
            triggerAlert('error', err.message);
        }
    };

    const handleAddToBag = async (product) => {
        const isClothing = product.category === 'kurta-pajama' || product.category === 'waistcoats';
        if (isClothing) {
            // Sizing item: redirect to details so they can select a size!
            triggerAlert('info', 'Please select a size on the product page first.');
            return;
        }

        try {
            await addToCart(product._id, null, 1);
            triggerAlert('success', 'Product added to shopping bag!');
        } catch (err) {
            triggerAlert('error', err.message);
        }
    };

    if (wishlistItems.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 50px' }}>
                <i className="fa-regular fa-heart" style={{ fontSize: '60px', color: '#ccc', marginBottom: '20px' }}></i>
                <h2>Your Wishlist is Empty</h2>
                <p style={{ color: '#777', margin: '15px 0 30px' }}>Keep track of products you love by adding them to your wishlist.</p>
                <Link to="/products" className="btn-primary">Browse Our Catalog</Link>
            </div>
        );
    }

    return (
        <div className="products-section" style={{ padding: '50px' }}>
            <Alert type={alertType} message={alertMessage} onClose={() => setAlertMessage('')} />
            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '30px' }}>My Wishlist</h1>

            <div className="product-grid">
                {wishlistItems.map((product) => (
                    <div key={product._id} className="product-card">
                        <button 
                            onClick={() => handleRemove(product._id)}
                            className="wishlist-btn-card wishlist-active"
                            title="Remove from Wishlist"
                        >
                            <i className="fa-solid fa-heart"></i>
                        </button>
                        
                        <div className="product-image-container">
                            <Link to={`/products/${product._id}`}>
                                <img src={getImageUrl(product.image)} alt={product.name} className="product-image" />
                            </Link>
                        </div>
                        
                        <div className="product-info">
                            <span className="product-category">{product.category}</span>
                            <h3 className="product-name">
                                <Link to={`/products/${product._id}`}>{product.name}</Link>
                            </h3>
                            <div className="product-pricing" style={{ marginBottom: '15px' }}>
                                {product.discountPrice && product.discountPrice < product.price ? (
                                    <>
                                        <span className="sale-price">Rs. {product.discountPrice}</span>
                                        <span className="original-price-strike">Rs. {product.price}</span>
                                    </>
                                ) : (
                                    <span>Rs. {product.price}</span>
                                )}
                            </div>

                            <button 
                                onClick={() => handleAddToBag(product)}
                                className="btn-dark"
                                style={{ width: '100%', padding: '10px 0', fontSize: '13px' }}
                            >
                                Add to Bag
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Wishlist;
