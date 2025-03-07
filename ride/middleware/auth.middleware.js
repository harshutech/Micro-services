const jwt = require('jsonwebtoken');
const axios = require('axios');

module.exports.authuser = async (req, res, next) => {
    try {
        console.log('🚀 Auth middleware triggered');

        // Extract token from cookies or Authorization header
        const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            console.error('❌ Token not found in request');
            return res.status(401).json({ error: 'Token not found' });
        }
        console.log('✅ Token extracted:', token);

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token successfully verified:', decoded);
        } catch (err) {
            console.error('❌ JWT verification failed:', err.message);
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Fetch user profile via Axios (through Gateway)
        try {
            console.log('🌍 Fetching user profile from Gateway...');
            const response = await axios.get(`http://localhost:3000/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            req.userId = decoded.userId;
            console.log('✅ User ID set in req.userId:', req.userId);

            next();  // Move to the next middleware
        } catch (err) {
            console.error('❌ Error fetching user profile:', err.message);
            if (err.response) {
                console.error('🔍 Response Status:', err.response.status);
                console.error('🔍 Response Data:', err.response.data);
            } else {
                console.error('❌ No response received from user profile service');
            }
            return res.status(500).json({ error: 'Error fetching user profile' });
        }

    } catch (error) {
        console.error('❌ Unexpected error in authentication middleware:', error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports.authcaptain = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[ 1 ];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const response = await axios.get('http://localhost:3000/captain/profile', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const captain = response.data;

        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.captain = captain;

        next();

    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}