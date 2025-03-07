const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const blacklistToken = require('../models/blacklistToken.model');

module.exports.authuser = async (req, res, next) => {
    try {
        const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
        if (!token) {
            console.error('Token not found');
            return res.status(401).send({ error: 'Token not found' });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            console.error('Invalid token:', err.message);
            return res.status(401).send({ error: 'Invalid token' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error in user side auth middleware:', error.message);
        res.status(500).send({ error: error.message });
    }
}