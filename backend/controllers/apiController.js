const Product = require('../models/Product');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const Subscriber = require('../models/Subscriber');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { sendConfirmationEmail } = require('../utils/email');

// 1. JWT Login (Stateless Authentication)
const apiLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        // Generate the JWT Token (The Digital Passport)
        // Payload includes user ID and role. Expires in 1 hour.
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ 
            success: true, 
            message: 'Login successful', 
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getApiProducts = async (req, res) => {
    try {
        let { page = 1, category, search, minPrice, maxPrice, sort, limit = 8 } = req.query;
        const limitNum = Number(limit);
        const pageNum = Number(page);
        const skip = (pageNum - 1) * limitNum;

        // Helper to escape special regex characters for search safety (ReDoS protection)
        const escapeRegex = (string) => {
            return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        };

        let query = {};
        if (category) query.category = category;
        if (search) query.name = { $regex: escapeRegex(search), $options: 'i' }; 
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        let sortQuery = {};
        if (sort === 'price-asc') sortQuery.price = 1;
        if (sort === 'price-desc') sortQuery.price = -1;

        const products = await Product.find(query).sort(sortQuery).skip(skip).limit(limitNum);
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitNum);

        res.json({ 
            success: true, 
            count: products.length, 
            totalProducts, 
            totalPages, 
            currentPage: pageNum, 
            data: products 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getFeaturedOffers = async (req, res) => {
    try {
        let featuredOffers = await Product.find({ discountPrice: { $ne: null, $gt: 0 } }).limit(4);
        if (featuredOffers.length < 4) {
            const excludeIds = featuredOffers.map(p => p._id);
            const additional = await Product.find({ _id: { $nin: excludeIds } })
                .limit(4 - featuredOffers.length);
            featuredOffers = [...featuredOffers, ...additional];
        }
        res.json({ success: true, count: featuredOffers.length, data: featuredOffers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching featured offers.' });
    }
};

// 3. Get Single Product (Public)
const getApiProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Invalid ID or Server error' });
    }
};

// 4. Get User Profile (Protected - Requires JWT)
const getApiProfile = async (req, res) => {
    try {
        // req.user.id comes from our verifyToken middleware!
        const user = await User.findById(req.user.id).select('-password'); // '-password' hides the hash from the JSON output
        
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



// 5. Submit an Order (Protected - Requires JWT)
const submitApiOrder = async (req, res) => {
    try {
        // Normalize input format: Support both single productId/quantity and items array
        let inputItems = [];
        if (req.body.items && Array.isArray(req.body.items)) {
            inputItems = req.body.items;
        } else if (req.body.productId) {
            inputItems = [{ productId: req.body.productId, quantity: req.body.quantity || 1 }];
        }

        if (inputItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Your order must contain at least one item.' });
        }

        // Validate items format and quantities
        for (let item of inputItems) {
            if (!item.productId || !item.productId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ success: false, message: `Invalid product ID format: ${item.productId}` });
            }
            const qtyNum = Number(item.quantity);
            if (!Number.isInteger(qtyNum) || qtyNum < 1) {
                return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
            }
            item.quantity = qtyNum;
        }

        // Extract and validate shipping address fields
        const addressData = req.body.shippingAddress || req.body;
        const { fullName, addressLine, city, postalCode, phone } = addressData;
        if (!fullName || !addressLine || !city || !postalCode || !phone) {
            return res.status(400).json({
                success: false,
                message: 'All shipping address fields (fullName, addressLine, city, postalCode, phone) are required.'
            });
        }

        // Validate payment method
        const paymentMethod = req.body.paymentMethod || 'COD';
        if (paymentMethod !== 'COD' && paymentMethod !== 'Card') {
            return res.status(400).json({ success: false, message: 'Payment method must be COD or Card.' });
        }

        // Verify stock levels and build order items array
        let orderItems = [];
        let totalAmount = 0;

        for (let item of inputItems) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ success: false, message: `Product with ID ${item.productId} was not found.` });
            }

            const isClothing = product.category === 'kurta-pajama' || product.category === 'waistcoats';
            if (isClothing) {
                if (!item.size || !['XS', 'S', 'M', 'L', 'XL'].includes(item.size)) {
                    return res.status(400).json({
                        success: false,
                        message: `Please select a valid size (XS, S, M, L, XL) for clothing product: ${product.name}`
                    });
                }
                const sizeStock = product.sizes.toObject()[item.size] || 0;
                if (sizeStock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${product.name} (Size ${item.size}). Only ${sizeStock} units are left.`
                    });
                }
            } else {
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${product.name}. Only ${product.stock} units are left.`
                    });
                }
            }

            const activePrice = (product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price) ? product.discountPrice : product.price;

            orderItems.push({
                product: product._id,
                name: product.name,
                price: activePrice,
                quantity: item.quantity,
                size: item.size || null
            });
            totalAmount += activePrice * item.quantity;
        }

        // Perform atomic operations to decrement stock and safeguard race conditions
        let updatedItems = [];
        let success = true;
        for (let item of inputItems) {
            const product = await Product.findById(item.productId);
            const isClothing = product.category === 'kurta-pajama' || product.category === 'waistcoats';

            let query = { _id: item.productId };
            let update = {};

            if (isClothing) {
                query['sizes.' + item.size] = { $gte: item.quantity };
                update.$inc = {
                    ['sizes.' + item.size]: -item.quantity,
                    stock: -item.quantity
                };
            } else {
                query.stock = { $gte: item.quantity };
                update.$inc = { stock: -item.quantity };
            }

            const result = await Product.findOneAndUpdate(query, update, { new: true });
            if (!result) {
                success = false;
                break;
            }
            updatedItems.push(item);
        }

        if (!success) {
            // Rollback already decremented stock items
            for (let item of updatedItems) {
                const product = await Product.findById(item.productId);
                const isClothing = product.category === 'kurta-pajama' || product.category === 'waistcoats';
                let update = {};
                if (isClothing) {
                    update.$inc = {
                        ['sizes.' + item.size]: item.quantity,
                        stock: item.quantity
                    };
                } else {
                    update.$inc = { stock: item.quantity };
                }
                await Product.findByIdAndUpdate(item.productId, update);
            }
            return res.status(409).json({
                success: false,
                message: 'One of the items in your checkout became out of stock. Transaction cancelled.'
            });
        }

        const isCardPaid = paymentMethod === 'Card';
        const transactionId = isCardPaid ? 'TXN-' + Date.now() + Math.floor(Math.random() * 1000) : null;

        const newOrder = new Order({
            user: req.user ? req.user.id : null,
            items: orderItems,
            shippingAddress: {
                fullName: fullName.trim(),
                addressLine: addressLine.trim(),
                city: city.trim(),
                postalCode: postalCode.trim(),
                phone: phone.trim()
            },
            paymentMethod,
            paymentStatus: isCardPaid ? 'Paid' : 'Pending',
            orderStatus: isCardPaid ? 'Processing' : 'Pending',
            totalAmount,
            transactionId
        });

        await newOrder.save();

        // Clear user cart from database upon successful checkout
        if (req.user && req.user.id) {
            const dbUser = await User.findById(req.user.id);
            if (dbUser) {
                dbUser.cart = [];
                await dbUser.save();
            }
        }

        // Run notification delivery asynchronously
        sendConfirmationEmail(newOrder);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            data: newOrder
        });
    } catch (err) {
        console.error('❌ API Checkout processing failed:', err);
        res.status(500).json({ success: false, message: 'Internal server error occurred.' });
    }
};

// GET Autocomplete search suggestions (AJAX)
const getSearchAutocomplete = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.json({ success: true, count: 0, data: [] });
        }

        // Perform case-insensitive partial match
        const regex = new RegExp(q.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        const products = await Product.find({ name: { $regex: regex } })
            .limit(5)
            .select('_id name price discountPrice image category');

        res.json({ success: true, count: products.length, data: products });
    } catch (err) {
        console.error('❌ API Search Autocomplete error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ==========================================
// 1. PUBLIC AUTH & USER PUBLIC ENDPOINTS
// ==========================================

const apiRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Password strength validation
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }
        if (password.length > 128) {
            return res.status(400).json({ success: false, message: 'Password must not exceed 128 characters.' });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must contain at least one number.' });
        }

        // Name validation
        if (!name || name.trim().length === 0 || name.length > 100) {
            return res.status(400).json({ success: false, message: 'Please provide a valid name (max 100 characters).' });
        }

        // Email validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }

        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            return res.status(400).json({ success: false, message: 'That email is already registered.' });
        }

        user = new User({ name: name.trim(), email: email.toLowerCase().trim(), password });
        await user.save();

        res.status(201).json({ success: true, message: 'Registration successful! You can now log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'An error occurred during registration.' });
    }
};

const apiForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email ? email.toLowerCase().trim() : '' });
        
        if (!user) {
            return res.json({ success: true, message: 'If that email exists in our system, a reset link has been sent.' });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 3600000; 
        await user.save();

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
            port: process.env.SMTP_PORT || 2525,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        });

        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${rawToken}`;
        
        const mailOptions = {
            from: '"Libas-e-Ikhlaq Store" <noreply@libaseikhlaq.com>',
            to: user.email,
            subject: 'Password Reset Request - Libas-e-Ikhlaq',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #111; text-align: center;">LIBAS-E-IKHLAQ</h2>
                    <h3 style="color: #222;">Hello, ${user.name}</h3>
                    <p>We received a request to reset your password. You can reset your password by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #E85624; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">RESET PASSWORD</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p style="color: #777; font-size: 12px; margin-top: 30px;">
                        This link is valid for 1 hour. If you did not request this, you can safely ignore this email.
                    </p>
                </div>
            `
        };

        const isCredentialsConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
        if (isCredentialsConfigured) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log(`✉️ [SMTP Settings Empty] Password reset link simulated:\nLink: ${resetUrl}`);
        }

        res.json({ success: true, message: 'If that email exists in our system, a reset link has been sent.' });
    } catch (err) {
        console.error('❌ Reset password token generation failed:', err);
        res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
    }
};

const apiResetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }
        if (password.length > 128) {
            return res.status(400).json({ success: false, message: 'Password must not exceed 128 characters.' });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ success: false, message: 'Password must contain at least one number.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
        }

        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        res.json({ success: true, message: 'Password has been successfully reset! You can now log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'An error occurred during password reset.' });
    }
};

const apiLogout = (req, res) => {
    res.json({ success: true, message: 'Stateless logout success. Please discard token.' });
};

// ==========================================
// 2. PUBLIC STORE ENDPOINTS
// ==========================================

const getApiCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching categories.' });
    }
};

const subscribeApiNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }

        const existing = await Subscriber.findOne({ email: email.toLowerCase().trim() });
        if (!existing) {
            const newSubscriber = new Subscriber({ email: email.toLowerCase().trim() });
            await newSubscriber.save();
        }

        console.log(`✉️ New Newsletter Subscriber stored in DB via API: ${email}`);
        res.json({ success: true, message: 'Thank you for subscribing to our newsletter!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Newsletter subscription failed.' });
    }
};

const getApiReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching reviews.' });
    }
};

// ==========================================
// 3. PROTECTED USER ENDPOINTS (Requires JWT)
// ==========================================

// Shopping Cart (Database Persisted)
const getApiCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const cart = user.cart || [];
        let cartItems = [];
        let subtotal = 0;

        for (let item of cart) {
            const product = await Product.findById(item.productId);
            if (product) {
                const activePrice = (product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price) ? product.discountPrice : product.price;
                const totalItemPrice = activePrice * item.quantity;
                subtotal += totalItemPrice;
                cartItems.push({
                    product,
                    quantity: item.quantity,
                    size: item.size || null,
                    totalItemPrice
                });
            }
        }

        res.json({ success: true, data: { cartItems, subtotal } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load cart' });
    }
};

const addApiCart = async (req, res) => {
    try {
        const { productId, quantity = 1, size } = req.body;
        const qtyNum = Number(quantity);

        if (!Number.isInteger(qtyNum) || qtyNum < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const isClothing = product.category === 'kurta-pajama' || product.category === 'waistcoats';
        let itemSize = null;

        if (isClothing) {
            if (!size || !['XS', 'S', 'M', 'L', 'XL'].includes(size)) {
                return res.status(400).json({ success: false, message: 'Please select a valid size (XS, S, M, L, XL).' });
            }
            itemSize = size;
        }

        const availableStock = isClothing ? (product.sizes.toObject()[itemSize] || 0) : product.stock;
        if (availableStock < qtyNum) {
            return res.status(400).json({ success: false, message: `Only ${availableStock} units of this size/item are currently available.` });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.cart) user.cart = [];

        const existingItem = user.cart.find(item => 
            item.productId.toString() === productId && 
            (item.size || '') === (itemSize || '')
        );

        if (existingItem) {
            const newQty = existingItem.quantity + qtyNum;
            if (availableStock < newQty) {
                return res.status(400).json({ success: false, message: `Cannot add more. Max available stock is ${availableStock}.` });
            }
            existingItem.quantity = newQty;
        } else {
            user.cart.push({ productId, size: itemSize, quantity: qtyNum });
        }

        await user.save();
        res.json({ success: true, message: `${product.name} added to cart.`, data: user.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
    }
};

const updateApiCart = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;
        const qtyNum = Number(quantity);
        const itemSize = size || null;

        const product = await Product.findById(productId);
        if (!product) {
            await User.findByIdAndUpdate(req.user.id, {
                $pull: { cart: { productId, size: itemSize } }
            });
            return res.status(404).json({ success: false, message: 'Product not found. Removed from cart.' });
        }

        const isClothing = product.category === 'kurta-pajama' || product.category === 'waistcoats';
        const availableStock = isClothing ? (product.sizes.toObject()[itemSize] || 0) : product.stock;

        if (qtyNum > 0 && qtyNum > availableStock) {
            return res.status(400).json({ success: false, message: `Only ${availableStock} units of this size/item are in stock.` });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (qtyNum <= 0) {
            user.cart = user.cart.filter(item => 
                !(item.productId.toString() === productId && (item.size || '') === (itemSize || ''))
            );
        } else {
            const cartItem = user.cart.find(item => 
                item.productId.toString() === productId && (item.size || '') === (itemSize || '')
            );
            if (cartItem) {
                cartItem.quantity = qtyNum;
            } else {
                user.cart.push({ productId, size: itemSize, quantity: qtyNum });
            }
        }

        await user.save();
        res.json({ success: true, message: 'Cart updated successfully.', data: user.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update cart.' });
    }
};

const removeApiCart = async (req, res) => {
    try {
        const { productId, size } = req.body;
        const itemSize = size || null;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.cart = user.cart.filter(item => 
            !(item.productId.toString() === productId && (item.size || '') === (itemSize || ''))
        );

        await user.save();
        res.json({ success: true, message: 'Item removed from cart.', data: user.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to remove product from cart.' });
    }
};

// Wishlist
const getApiWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('wishlist');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user.wishlist });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve wishlist.' });
    }
};

const addApiWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isAlreadyInWishlist = user.wishlist.some(id => id.toString() === productId);
        if (isAlreadyInWishlist) {
            return res.status(400).json({ success: false, message: 'Product is already in your wishlist.' });
        }

        user.wishlist.push(productId);
        await user.save();
        res.json({ success: true, message: `${product.name} added to wishlist.`, data: user.wishlist });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update wishlist.' });
    }
};

const removeApiWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();
        res.json({ success: true, message: 'Product removed from wishlist.', data: user.wishlist });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update wishlist.' });
    }
};

// Orders & Invoices
const getApiOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve order history.' });
    }
};

const getApiOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        const isOwner = order.user && order.user.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to view this order.' });
        }

        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve order.' });
    }
};

const downloadApiInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        const isOwner = order.user && order.user.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to download this invoice.' });
        }

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);
        doc.pipe(res);

        // Header Section
        doc.fillColor('#E85624').fontSize(24).text('LIBAS-E-IKHLAQ', { align: 'left' });
        doc.fillColor('#777777').fontSize(10).text('Premium Eastern Apparel Store', { align: 'left' });
        doc.moveDown();
        doc.fillColor('#333333').fontSize(14).text('INVOICE', { align: 'right' });
        doc.fontSize(10).text(`Invoice Number: INV-${order._id.toString().substring(0, 8).toUpperCase()}`, { align: 'right' });
        doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2);

        // Shipping Details
        doc.fillColor('#E85624').fontSize(12).text('BILL TO:', { underline: true });
        doc.fillColor('#333333').fontSize(10);
        doc.text(`Name: ${order.shippingAddress.fullName}`);
        doc.text(`Address: ${order.shippingAddress.addressLine}`);
        doc.text(`City: ${order.shippingAddress.city}`);
        doc.text(`Postal Code: ${order.shippingAddress.postalCode}`);
        doc.text(`Phone: ${order.shippingAddress.phone}`);
        doc.moveDown(2);

        // Table Header
        const startY = doc.y;
        doc.fillColor('#E85624').fontSize(10);
        doc.text('Item Description', 50, startY);
        doc.text('Size', 250, startY);
        doc.text('Price', 320, startY, { width: 60, align: 'right' });
        doc.text('Qty', 400, startY, { width: 40, align: 'right' });
        doc.text('Total', 460, startY, { width: 80, align: 'right' });
        doc.moveTo(50, startY + 15).lineTo(540, startY + 15).strokeColor('#E85624').stroke();

        let currentY = startY + 25;
        doc.fillColor('#333333');
        let subtotal = 0;
        for (let item of order.items) {
            doc.text(item.name, 50, currentY, { width: 190 });
            doc.text(item.size || 'N/A', 250, currentY);
            doc.text(`Rs. ${item.price}`, 320, currentY, { width: 60, align: 'right' });
            doc.text(item.quantity.toString(), 400, currentY, { width: 40, align: 'right' });
            const itemTotal = item.price * item.quantity;
            doc.text(`Rs. ${itemTotal}`, 460, currentY, { width: 80, align: 'right' });
            subtotal += itemTotal;
            currentY += 20;
        }

        doc.moveTo(50, currentY).lineTo(540, currentY).strokeColor('#dddddd').stroke();
        currentY += 15;

        // Summary
        doc.text('Subtotal:', 350, currentY, { width: 110, align: 'right' });
        doc.text(`Rs. ${subtotal}`, 460, currentY, { width: 80, align: 'right' });
        currentY += 15;

        if (order.discountAmount && order.discountAmount > 0) {
            doc.text(`Discount (${order.couponCode || 'Promo'}):`, 300, currentY, { width: 160, align: 'right' });
            doc.text(`-Rs. ${order.discountAmount}`, 460, currentY, { width: 80, align: 'right' });
            currentY += 15;
        }

        doc.fillColor('#E85624').fontSize(11).text('Grand Total:', 350, currentY, { width: 110, align: 'right' });
        doc.text(`Rs. ${order.totalAmount}`, 460, currentY, { width: 80, align: 'right' });

        doc.moveDown(4);
        doc.fillColor('#777777').fontSize(10).text('Thank you for shopping with Libas-e-Ikhlaq!', { align: 'center', italic: true });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to generate invoice.' });
    }
};

// Coupons & Reviews Submission
const applyApiCoupon = async (req, res) => {
    try {
        const { couponCode, subtotal } = req.body;
        if (!couponCode) {
            return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
        }
        if (!subtotal || Number(subtotal) <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid subtotal.' });
        }

        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (!coupon) {
            return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code.' });
        }

        if (coupon.expiryDate < new Date()) {
            return res.status(400).json({ success: false, message: 'This coupon code has expired.' });
        }

        if (Number(subtotal) < coupon.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of Rs. ${coupon.minOrderAmount} is required to apply this coupon.`
            });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = Math.round(Number(subtotal) * (coupon.discountAmount / 100));
        } else if (coupon.discountType === 'flat') {
            discountAmount = coupon.discountAmount;
        }

        discountAmount = Math.min(discountAmount, Number(subtotal));
        const finalTotal = Number(subtotal) - discountAmount;

        res.json({
            success: true,
            message: 'Coupon applied successfully!',
            couponCode: coupon.code,
            discountAmount,
            finalTotal
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error while applying coupon.' });
    }
};

const addApiReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.id;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const newReview = new Review({
            product: productId,
            user: user._id,
            userName: user.name,
            rating: Number(rating),
            comment: comment
        });

        await newReview.save();

        const reviews = await Review.find({ product: productId });
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);

        await Product.findByIdAndUpdate(productId, { rating: Number(averageRating) });

        res.status(201).json({ success: true, message: 'Review submitted successfully!', data: newReview });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to save review.' });
    }
};

// ==========================================
// 4. PROTECTED ADMIN ENDPOINTS (Requires JWT & Admin Role)
// ==========================================

const getAdminDashboard = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({ success: true, count: products.length, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching admin products.' });
    }
};

const addAdminProduct = async (req, res) => {
    try {
        const { name, price, discountPrice, stock, category, sizes, description } = req.body;
        const imagePath = req.file ? '/uploads/' + req.file.filename : '/sale.png';
        
        const isClothing = category === 'kurta-pajama' || category === 'waistcoats';
        let stockVal = Number(stock);
        let sizesObj = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };

        if (isClothing && sizes) {
            let parsedSizes = sizes;
            if (typeof sizes === 'string') {
                try { parsedSizes = JSON.parse(sizes); } catch (e) {}
            }
            sizesObj = {
                XS: Number(parsedSizes.XS) || 0,
                S: Number(parsedSizes.S) || 0,
                M: Number(parsedSizes.M) || 0,
                L: Number(parsedSizes.L) || 0,
                XL: Number(parsedSizes.XL) || 0
            };
            stockVal = Object.values(sizesObj).reduce((a, b) => a + b, 0);
        }

        const newProduct = new Product({
            name,
            price: Number(price),
            discountPrice: discountPrice ? Number(discountPrice) : null,
            stock: stockVal,
            category,
            sizes: sizesObj,
            image: imagePath,
            description: description || ''
        });

        await newProduct.save();
        res.status(201).json({ success: true, message: 'Product successfully added!', data: newProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to add product.' });
    }
};

const updateAdminProduct = async (req, res) => {
    try {
        const { name, price, discountPrice, stock, category, sizes, description } = req.body;
        const isClothing = category === 'kurta-pajama' || category === 'waistcoats';
        let stockVal = Number(stock);
        let sizesObj = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };

        if (isClothing && sizes) {
            let parsedSizes = sizes;
            if (typeof sizes === 'string') {
                try { parsedSizes = JSON.parse(sizes); } catch (e) {}
            }
            sizesObj = {
                XS: Number(parsedSizes.XS) || 0,
                S: Number(parsedSizes.S) || 0,
                M: Number(parsedSizes.M) || 0,
                L: Number(parsedSizes.L) || 0,
                XL: Number(parsedSizes.XL) || 0
            };
            stockVal = Object.values(sizesObj).reduce((a, b) => a + b, 0);
        }

        let updateData = {
            name,
            price: Number(price),
            discountPrice: discountPrice ? Number(discountPrice) : null,
            stock: stockVal,
            category,
            sizes: sizesObj,
            description: description || ''
        };

        if (req.file) {
            updateData.image = '/uploads/' + req.file.filename;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

        res.json({ success: true, message: 'Product updated successfully.', data: product });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update product.' });
    }
};

const deleteAdminProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
        res.json({ success: true, message: 'Product deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete product.' });
    }
};

const getAdminOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching admin orders.' });
    }
};

const updateAdminOrderStatus = async (req, res) => {
    try {
        const { orderStatus, paymentStatus } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus, paymentStatus }, { new: true });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
        res.json({ success: true, message: 'Order status updated successfully.', data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update order status.' });
    }
};

const getAdminAnalytics = async (req, res) => {
    try {
        const orders = await Order.find();
        const products = await Product.find();
        const totalUsers = await User.countDocuments();

        let totalRevenue = 0;
        let totalOrders = orders.length;
        let pendingDeliveries = 0;

        for (let order of orders) {
            if (order.orderStatus !== 'Cancelled') {
                totalRevenue += order.totalAmount;
            }
            if (order.orderStatus === 'Pending' || order.orderStatus === 'Processing') {
                pendingDeliveries++;
            }
        }

        const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
        const lowStockProducts = products.filter(p => p.stock <= 5);

        const productSales = {};
        for (let order of orders) {
            if (order.orderStatus === 'Cancelled') continue;
            for (let item of order.items) {
                if (item.product) {
                    const pidStr = item.product.toString();
                    if (!productSales[pidStr]) {
                        productSales[pidStr] = {
                            name: item.name,
                            unitsSold: 0,
                            revenue: 0
                        };
                    }
                    productSales[pidStr].unitsSold += item.quantity;
                    productSales[pidStr].revenue += (item.price * item.quantity);
                }
            }
        }

        const productMap = {};
        for (let p of products) {
            productMap[p._id.toString()] = p.category;
        }

        const topProductsList = Object.keys(productSales).map(pid => {
            return {
                _id: pid,
                name: productSales[pid].name,
                unitsSold: productSales[pid].unitsSold,
                revenue: productSales[pid].revenue,
                category: productMap[pid] || 'N/A'
            };
        });

        topProductsList.sort((a, b) => b.unitsSold - a.unitsSold);
        const topProducts = topProductsList.slice(0, 5);

        const salesTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            salesTrend.push({ date: dateStr, amount: 0 });
        }

        for (let order of orders) {
            if (order.orderStatus === 'Cancelled') continue;
            const orderDateStr = new Date(order.createdAt).toISOString().split('T')[0];
            const dayEntry = salesTrend.find(entry => entry.date === orderDateStr);
            if (dayEntry) {
                dayEntry.amount += order.totalAmount;
            }
        }

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                totalUsers,
                pendingDeliveries,
                averageOrderValue,
                lowStockProducts,
                lowStockCount: lowStockProducts.length,
                topProducts,
                salesTrend
            }
        });
    } catch (err) {
        console.error('❌ Analytics API computation failed:', err);
        res.status(500).json({ success: false, message: 'Server error computing analytics.' });
    }
};

const getAdminUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        const usersWithOrderCount = await Promise.all(users.map(async (user) => {
            const orderCount = await Order.countDocuments({ user: user._id });
            const userObj = user.toObject();
            userObj.orderCount = orderCount;
            return userObj;
        }));

        res.json({ success: true, count: usersWithOrderCount.length, data: usersWithOrderCount });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching user list.' });
    }
};

const toggleAdminUserRole = async (req, res) => {
    try {
        const userId = req.params.id;

        if (userId === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot change your own admin role.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.role === 'admin' && userId !== req.user.id) {
            return res.status(400).json({ success: false, message: 'Security policy: You cannot demote another administrator.' });
        }

        user.role = user.role === 'admin' ? 'customer' : 'admin';
        await user.save();

        res.json({ success: true, message: `User role successfully updated to ${user.role}!`, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update user role.' });
    }
};

const getAdminReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('product', 'name category')
            .populate('user', 'email')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching reviews.' });
    }
};

const deleteAdminReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        const productId = review.product;
        await Review.findByIdAndDelete(reviewId);

        const remainingReviews = await Review.find({ product: productId });
        let averageRating = 0;
        if (remainingReviews.length > 0) {
            const totalRating = remainingReviews.reduce((sum, r) => sum + r.rating, 0);
            averageRating = Number((totalRating / remainingReviews.length).toFixed(1));
        }

        await Product.findByIdAndUpdate(productId, { rating: averageRating });

        res.json({ success: true, message: 'Review successfully deleted and product rating updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete review.' });
    }
};
const getGlobalSaleSetting = async (req, res) => {
    try {
        const { getGlobalDiscount } = require('../utils/settingsHelper');
        const discount = getGlobalDiscount();
        res.json({ success: true, data: { globalDiscount: discount } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve global discount setting.' });
    }
};

const updateGlobalSaleSetting = async (req, res) => {
    try {
        const { getGlobalDiscount, setGlobalDiscount } = require('../utils/settingsHelper');
        const { globalDiscount } = req.body;
        const numVal = Math.min(Math.max(Number(globalDiscount) || 0, 0), 100);
        const updatedVal = await setGlobalDiscount(numVal);
        res.json({ success: true, message: `Global discount updated to ${updatedVal}%.`, data: { globalDiscount: updatedVal } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update global discount setting.' });
    }
};

module.exports = {
    apiLogin,
    getApiProducts,
    getFeaturedOffers,
    getApiProductById,
    getApiProfile,
    submitApiOrder,
    getSearchAutocomplete,
    apiRegister,
    apiForgotPassword,
    apiResetPassword,
    apiLogout,
    getApiCategories,
    subscribeApiNewsletter,
    getApiReviews,
    getApiCart,
    addApiCart,
    updateApiCart,
    removeApiCart,
    getApiWishlist,
    addApiWishlist,
    removeApiWishlist,
    getApiOrders,
    getApiOrderById,
    downloadApiInvoice,
    applyApiCoupon,
    addApiReview,
    getAdminDashboard,
    addAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
    getAdminOrders,
    updateAdminOrderStatus,
    getAdminAnalytics,
    getAdminUsers,
    toggleAdminUserRole,
    getAdminReviews,
    deleteAdminReview,
    getGlobalSaleSetting,
    updateGlobalSaleSetting
};