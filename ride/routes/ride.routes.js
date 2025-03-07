const express = require('express');
const router = express.Router();
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/create-ride',authMiddleware.authuser, rideController.create);
router.put('/accepted-ride', authMiddleware.authcaptain, rideController.acceptRide);
router.put('/accept-ride', rideController.acceptRide);

module.exports = router;

