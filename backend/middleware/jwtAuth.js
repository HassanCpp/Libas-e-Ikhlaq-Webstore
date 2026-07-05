const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = null;

    // 1. Look for the token in the request headers or fallback to query parameters
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    // 2. If there is no token, deny access
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Access Denied. No token provided.",
            debug: {
                hasAuthHeader: !!authHeader,
                authHeaderValue: authHeader,
                query: req.query,
                originalUrl: req.originalUrl
            }
        });
    }

    try {
        // 4. Mathematically verify the token using your secret key
        const verifiedUser = jwt.verify(token, process.env.JWT_SECRET);
        
        // 5. Attach the decrypted user data to the request so the controller can use it
        req.user = verifiedUser;
        
        // 6. Move to the next function on the assembly line!
        next();
    } catch (err) {
        // If the token is fake, expired, or tampered with, it throws an error
        res.status(403).json({ 
            success: false, 
            message: "Invalid or Expired Token." 
        });
    }
};

const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ 
        success: false, 
        message: "Access Denied. Administrators Only." 
    });
};

module.exports = { verifyToken, verifyAdmin };