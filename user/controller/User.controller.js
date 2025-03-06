const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const blacklistToken = require('../models/blacklistToken.model');


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
    const token = req.cookies.token;
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
    res.status(200).json({
      name: user.name,
      email: user.email
    });
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
