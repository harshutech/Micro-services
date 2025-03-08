const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const blacklistToken = require('../models/blacklistToken.model');
// New imports for ride events and RabbitMQ
const { subscribeToQueue } = require('../service/rabbit');
const EventEmitter = require('events');
const rideEvent = new EventEmitter();
const nodemailer = require('nodemailer'); // new import for nodemailer

module.exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await UserModel.findOne({
      email
    });
    if (user) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword
    });
    await newUser.save();

    // New: Send welcome email using nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // set your email user in env
        pass: process.env.EMAIL_PASS  // set your email password in env
      },
      tls: {
        rejectUnauthorized: false // allow self-signed certificate
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Our Service',
      text: 'Thank you for registering with us!'
    });

    const token = jwt.sign({
        userId: newUser._id
        }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    })
    res.cookie('token', token);
    res.status(201).json({
      message: 'User created successfully'
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
      const user = await UserModel.findOne({ email });
      
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Invalid password'
        });
      }
      
      const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
      );
      
      // Set cookie and return token in response
      res.cookie('token', token, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      
      res.status(200).json({
        message: 'User logged in successfully',
        token: token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
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
    let token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    const isTokenBlacklisted = await blacklistToken.findOne({ token });
    if (isTokenBlacklisted) {
      return res.status(401).json({
        message: 'Token is blacklisted'
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decodedToken.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    res.send(req.user);
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
      message: 'User logged out successfully'
    });
} catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
}

module.exports.waitForRideAccepted = async (req, res, next) =>{
  rideEvent.on('ride-accepted', async (ride) => {
    console.log('Ride accepted:', ride);
    res.send(ride);
  });

  setTimeout(() => {
    res.status(204).send();
  }, 3000);

  subscribeToQueue("ride-accepted", (msg) => {
   const data = JSON.parse(msg);
   rideEvent.emit('ride-accepted', data);
  });
}