const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const token = req.headers.authorization?.split(' ')[1]; 
        if (!token) return res.status(401).json({ message: 'No token provided' });

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB
        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Attach user to request object
        req.user = user;

        // Pass control to next middleware / route
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
