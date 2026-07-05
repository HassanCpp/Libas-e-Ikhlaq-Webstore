const mongoose = require('mongoose');

// Define the blueprint for our Libas-e-Ikhlaq products
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 200
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountPrice: {
        type: Number,
        default: null,
        min: 0
    },
    category: {
        type: String,
        required: true,
        // We restrict categories to match our navigation exactly!
        enum: ['unstitched', 'kurta-pajama', 'waistcoats', 'fragrance', 'accessories'] 
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    sizes: {
        XS: { type: Number, default: 0, min: 0 },
        S: { type: Number, default: 0, min: 0 },
        M: { type: Number, default: 0, min: 0 },
        L: { type: Number, default: 0, min: 0 },
        XL: { type: Number, default: 0, min: 0 }
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    image: {
        type: String, // This will hold the URL to the picture
        required: true
    },
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Post-init hook to apply global sale discount percentage dynamically
productSchema.post('init', function(doc) {
    try {
        const { getGlobalDiscount } = require('../utils/settingsHelper');
        const globalDiscount = getGlobalDiscount();
        if (globalDiscount > 0) {
            const globalSalePrice = Math.round(doc.price * (1 - globalDiscount / 100));
            if (doc.discountPrice && doc.discountPrice > 0 && doc.discountPrice < doc.price) {
                doc.discountPrice = Math.min(doc.discountPrice, globalSalePrice);
            } else {
                doc.discountPrice = globalSalePrice;
            }
        }
    } catch (e) {
        console.error("Error in Product post-init hook:", e);
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;