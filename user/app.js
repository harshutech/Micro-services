const dotenv = require('dotenv');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user.routes');
const connect = require('./db/db');

dotenv.config(); // Ensure this is at the very beginning
connect();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/', userRoutes);

module.exports = app;
