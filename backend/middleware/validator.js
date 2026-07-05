const { body, validationResult } = require('express-validator');

const registerValidationRules = () => {
    return [
        body('name')
            .trim()
            .notEmpty().withMessage('Please provide a name.')
            .isLength({ max: 100 }).withMessage('Name must not exceed 100 characters.'),
        body('email')
            .trim()
            .isEmail().withMessage('Please provide a valid email address.')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
            .isLength({ max: 128 }).withMessage('Password must not exceed 128 characters.')
            .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
            .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    ];
};

const ejsCheckoutValidationRules = () => {
    return [
        body('fullName')
            .trim()
            .notEmpty().withMessage('Full name is required.')
            .isLength({ max: 200 }).withMessage('Full name must not exceed 200 characters.'),
        body('addressLine')
            .trim()
            .notEmpty().withMessage('Address is required.')
            .isLength({ max: 200 }).withMessage('Address must not exceed 200 characters.'),
        body('city')
            .trim()
            .notEmpty().withMessage('City is required.')
            .isLength({ max: 200 }).withMessage('City must not exceed 200 characters.'),
        body('postalCode')
            .trim()
            .notEmpty().withMessage('Postal code is required.')
            .isLength({ max: 200 }).withMessage('Postal code must not exceed 200 characters.'),
        body('phone')
            .trim()
            .notEmpty().withMessage('Phone number is required.')
            .isLength({ max: 200 }).withMessage('Phone number must not exceed 200 characters.'),
        body('paymentMethod')
            .isIn(['COD', 'Card']).withMessage('Payment method must be COD or Card.')
    ];
};

const apiCheckoutValidationRules = () => {
    return [
        body('shippingAddress.fullName')
            .trim()
            .notEmpty().withMessage('Full name is required.')
            .isLength({ max: 200 }).withMessage('Full name must not exceed 200 characters.'),
        body('shippingAddress.addressLine')
            .trim()
            .notEmpty().withMessage('Address is required.')
            .isLength({ max: 200 }).withMessage('Address must not exceed 200 characters.'),
        body('shippingAddress.city')
            .trim()
            .notEmpty().withMessage('City is required.')
            .isLength({ max: 200 }).withMessage('City must not exceed 200 characters.'),
        body('shippingAddress.postalCode')
            .trim()
            .notEmpty().withMessage('Postal code is required.')
            .isLength({ max: 200 }).withMessage('Postal code must not exceed 200 characters.'),
        body('shippingAddress.phone')
            .trim()
            .notEmpty().withMessage('Phone number is required.')
            .isLength({ max: 200 }).withMessage('Phone number must not exceed 200 characters.'),
        body('paymentMethod')
            .isIn(['COD', 'Card']).withMessage('Payment method must be COD or Card.')
    ];
};

// Generic validation check middleware/handler helper
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    // Check if it's an API request
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }

    // Otherwise standard EJS flash and redirect back
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect('back');
};

module.exports = {
    registerValidationRules,
    ejsCheckoutValidationRules,
    apiCheckoutValidationRules,
    validate
};
