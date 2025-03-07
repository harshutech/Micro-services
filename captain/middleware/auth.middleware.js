const jwt = require('jsonwebtoken');
const captainModel = require('../models/captain.model');
const blacklistToken = require('../models/blacklistToken.model');



module.exports.captainauth = async (req, res, next) => {
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
        const captain = await captainModel.findById(decoded.captainId);
        if (!captain) {
            return res.status(404).json({
                message: 'captain not found'
            });
        }
        req.captain = captain;
        next();
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}