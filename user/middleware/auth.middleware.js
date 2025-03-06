const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const blacklistToken = require('../models/blacklistToken.model');



module.exports.userauth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }
        const isTokenBlacklisted = await blacklistToken.findOne({
            token
        });
        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}