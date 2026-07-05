const Settings = require('../models/Settings');

let globalDiscount = 0;

const initSettings = async () => {
    try {
        const setting = await Settings.findOne({ key: 'globalDiscount' });
        if (setting) {
            globalDiscount = Number(setting.value) || 0;
        } else {
            // Initialize default
            await Settings.create({ key: 'globalDiscount', value: 0 });
            globalDiscount = 0;
        }
        console.log(`ℹ️ Loaded Global Discount Setting: ${globalDiscount}%`);
    } catch (e) {
        console.error("Failed to load global discount setting:", e);
    }
};

const getGlobalDiscount = () => globalDiscount;

const setGlobalDiscount = async (value) => {
    const numVal = Math.min(Math.max(Number(value) || 0, 0), 100);
    globalDiscount = numVal;
    await Settings.findOneAndUpdate(
        { key: 'globalDiscount' },
        { value: numVal },
        { upsert: true }
    );
    return numVal;
};

const applyGlobalDiscount = (product) => {
    if (!product) return product;
    
    // Check if it's a mongoose document and convert to object, or handle standard objects
    const prodObj = (typeof product.toObject === 'function') ? product.toObject() : product;
    
    if (globalDiscount > 0) {
        const globalSalePrice = Math.round(prodObj.price * (1 - globalDiscount / 100));
        if (prodObj.discountPrice && prodObj.discountPrice > 0 && prodObj.discountPrice < prodObj.price) {
            prodObj.discountPrice = Math.min(prodObj.discountPrice, globalSalePrice);
        } else {
            prodObj.discountPrice = globalSalePrice;
        }
    }
    return prodObj;
};

const applyGlobalDiscountList = (products) => {
    if (!products || !Array.isArray(products)) return products;
    return products.map(applyGlobalDiscount);
};

module.exports = {
    initSettings,
    getGlobalDiscount,
    setGlobalDiscount,
    applyGlobalDiscount,
    applyGlobalDiscountList
};
