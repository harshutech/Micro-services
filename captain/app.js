const express = require('express');
const app = express();
const captainRoutes = require('./routes/captain.route');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connect = require('./db/db');
const RabbitMQ = require('./service/rabbit');

dotenv.config();
RabbitMQ.connect();
connect();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/', captainRoutes);  

module.exports = app;
