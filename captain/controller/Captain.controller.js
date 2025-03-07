const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const captainModel = require('../models/captain.model');
const blacklistToken = require('../models/blacklistToken.model');
const { subscribeToQueue, publishToQueue } = require('../service/rabbit');

const pendingRequests = []; // Store ride requests for each captain

module.exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const captain = await captainModel.findOne({
      email
    });
    if (captain) {
      return res.status(400).json({
        message: 'captain already exists'
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newcaptain = new captainModel({
      name,
      email,
      password: hashedPassword
    });
    await newcaptain.save();
    const token = jwt.sign({
        captainId: newcaptain._id
        }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    })
    res.cookie('token', token);
    res.status(201).json({
      message: 'captain created successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const captain = await captainModel.findOne({ email });
      
      if (!captain) {
        return res.status(404).json({
          message: 'captain not found'
        });
      }
      
      const isPasswordValid = await bcrypt.compare(password, captain.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Invalid password'
        });
      }
      
      const token = jwt.sign(
          { captainId: captain._id },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
      );
      
      // Set cookie and return token in response
      res.cookie('token', token, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      
      res.status(200).json({
        message: 'captain logged in successfully',
        token: token,
        captain: {
          id: captain._id,
          name: captain.name,
          email: captain.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: error.message
      });
    } 
  };

module.exports.profile = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization.split(' ')[1];
    const isTokenBlacklisted = await blacklistToken.findOne({ token });
    if (isTokenBlacklisted) {
      return res.status(401).json({
        message: 'Token is blacklisted'
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const captain = await captainModel.findById(decodedToken.captainId);
    if (!captain) {
      return res.status(404).json({
        message: 'captain not found'
      });
    }
    res.status(200).send(captain);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
}

module.exports.logout = async (req, res)  => {
    try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({
        message: 'Token not found'
      });
    }
    const isTokenBlacklisted = await blacklistToken.findOne({ token});
    if (isTokenBlacklisted) {
      return res.status(400).json({
        message: 'Unauthorized'
      });
    }    
    await blacklistToken.create({ token });
    res.clearCookie('token');
    res.status(200).json({
      message: 'captain logged out successfully'
    });
} catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
}

module.exports.avilability = async (req, res) => {
  try {
    const captain = await captainModel.findById(req.captain._id);
    if (!captain) {
      return res.status(404).json({
        message: 'captain not found'
      });
    }
    captain.isAvilable = !captain.isAvilable;
    await captain.save();
    res.status(200).json({
      message: 'captain availability updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
}

module.exports.waitForNewRide = async (req, res) => {
  req.setTimeout(30000,()=>{
    res.status(204).end();
  })

  pendingRequests.push(res);
};

subscribeToQueue('new-ride', (data) => {
  const rideData = JSON.parse(data);

  // send the ride data to all pending requests
  pendingRequests.forEach((res) => {
    res.status(200).json({Data:rideData});
  });

  pendingRequests.length = 0; 
});
 