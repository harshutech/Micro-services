const express = require('express');
const router = express.Router();
const captainController = require('../controller/Captain.controller');
const authMiddleware = require('../middleware/auth.middleware');



router.post('/register', captainController.register);
router.post('/login', captainController.login);
router.get('/logout', captainController.logout);
router.get('/profile',authMiddleware.captainauth, captainController.profile);
router.patch('/avilability',authMiddleware.captainauth, captainController.avilability);
router.get('/new-ride',authMiddleware.captainauth, captainController.waitForNewRide);

module.exports = router;