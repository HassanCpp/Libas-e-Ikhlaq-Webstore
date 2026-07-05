import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { token } = useContext(AuthContext);
    const [cartItems, setCartItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);

    const fetchCartAndWishlist = async () => {
        if (!token) {
            // Load guest cart from localStorage
            const localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            setCartItems(localCart);
            
            // Recalculate subtotal
            const sub = localCart.reduce((sum, item) => {
                const price = (item.product.discountPrice && item.product.discountPrice > 0 && item.product.discountPrice < item.product.price) 
                    ? item.product.discountPrice 
                    : item.product.price;
                return sum + (price * item.quantity);
            }, 0);
            setSubtotal(sub);
            setWishlistItems([]);
            return;
        }
        try {
            // Fetch cart from database
            const cartRes = await api.get('/cart');
            if (cartRes.success) {
                setCartItems(cartRes.data.cartItems || []);
                setSubtotal(cartRes.data.subtotal || 0);
            }
            
            // Fetch wishlist from database
            const wishRes = await api.get('/wishlist');
            if (wishRes.success) {
                setWishlistItems(wishRes.data || []);
            }
        } catch (err) {
            console.error('Error fetching cart/wishlist:', err);
        }
    };

    // Sync guest cart to database upon login, then load cart
    useEffect(() => {
        const syncCart = async () => {
            if (token) {
                const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
                if (guestCart.length > 0) {
                    for (let item of guestCart) {
                        try {
                            await api.post('/cart/add', {
                                productId: item.product._id,
                                size: item.size || null,
                                quantity: item.quantity
                            });
                        } catch (e) {
                            console.error("Failed to sync guest cart item:", e);
                        }
                    }
                    localStorage.removeItem('guest_cart');
                }
            }
            fetchCartAndWishlist();
        };

        syncCart();
    }, [token]);

    const addToCart = async (productId, size = null, quantity = 1) => {
        if (!token) {
            // Guest mode: fetch product info and store in localStorage
            try {
                const prodRes = await api.get(`/products/${productId}`);
                if (!prodRes || !prodRes.success) {
                    throw new Error('Product not found.');
                }
                const product = prodRes.data;

                let localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
                const existingIdx = localCart.findIndex(item => item.product._id === productId && item.size === size);
                
                if (existingIdx > -1) {
                    localCart[existingIdx].quantity += quantity;
                } else {
                    localCart.push({
                        product,
                        quantity,
                        size
                    });
                }

                localStorage.setItem('guest_cart', JSON.stringify(localCart));
                setCartItems(localCart);
                
                const sub = localCart.reduce((sum, item) => {
                    const price = (item.product.discountPrice && item.product.discountPrice > 0 && item.product.discountPrice < item.product.price) 
                        ? item.product.discountPrice 
                        : item.product.price;
                    return sum + (price * item.quantity);
                }, 0);
                setSubtotal(sub);
                return { success: true };
            } catch (err) {
                throw err;
            }
        }

        // Authenticated mode: call backend
        try {
            const res = await api.post('/cart/add', { productId, size, quantity });
            if (res.success) {
                await fetchCartAndWishlist();
            }
            return res;
        } catch (err) {
            throw err;
        }
    };

    const updateCartQty = async (productId, quantity, size = null) => {
        if (!token) {
            // Guest mode
            let localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            const idx = localCart.findIndex(item => item.product._id === productId && item.size === size);
            if (idx > -1) {
                localCart[idx].quantity = quantity;
                localStorage.setItem('guest_cart', JSON.stringify(localCart));
                setCartItems(localCart);
                
                const sub = localCart.reduce((sum, item) => {
                    const price = (item.product.discountPrice && item.product.discountPrice > 0 && item.product.discountPrice < item.product.price) 
                        ? item.product.discountPrice 
                        : item.product.price;
                    return sum + (price * item.quantity);
                }, 0);
                setSubtotal(sub);
            }
            return { success: true };
        }

        // Authenticated mode
        try {
            const res = await api.post('/cart/update', { productId, quantity, size });
            if (res.success) {
                await fetchCartAndWishlist();
            }
            return res;
        } catch (err) {
            throw err;
        }
    };

    const removeFromCart = async (productId, size = null) => {
        if (!token) {
            // Guest mode
            let localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            localCart = localCart.filter(item => !(item.product._id === productId && item.size === size));
            localStorage.setItem('guest_cart', JSON.stringify(localCart));
            setCartItems(localCart);
            
            const sub = localCart.reduce((sum, item) => {
                const price = (item.product.discountPrice && item.product.discountPrice > 0 && item.product.discountPrice < item.product.price) 
                    ? item.product.discountPrice 
                    : item.product.price;
                return sum + (price * item.quantity);
            }, 0);
            setSubtotal(sub);
            return { success: true };
        }

        // Authenticated mode
        try {
            const res = await api.post('/cart/remove', { productId, size });
            if (res.success) {
                await fetchCartAndWishlist();
            }
            return res;
        } catch (err) {
            throw err;
        }
    };

    const addToWishlist = async (productId) => {
        if (!token) {
            throw new Error('Please log in to save items to your wishlist.');
        }
        try {
            const res = await api.post('/wishlist/add', { productId });
            if (res.success) {
                await fetchCartAndWishlist();
            }
            return res;
        } catch (err) {
            throw err;
        }
    };

    const removeFromWishlist = async (productId) => {
        if (!token) {
            throw new Error('Please log in to modify items in your wishlist.');
        }
        try {
            const res = await api.post('/wishlist/remove', { productId });
            if (res.success) {
                await fetchCartAndWishlist();
            }
            return res;
        } catch (err) {
            throw err;
        }
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            wishlistItems,
            subtotal,
            addToCart,
            updateCartQty,
            removeFromCart,
            addToWishlist,
            removeFromWishlist,
            fetchCartAndWishlist
        }}>
            {children}
        </CartContext.Provider>
    );
};
