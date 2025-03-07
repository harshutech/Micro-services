const dotenv = require('dotenv');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const rideroutes = require('./routes/ride.routes');
const connect = require('./db/db');
const rabbitMQ = require('./service/rabbit');

dotenv.config(); // Ensure this is at the very beginning
rabbitMQ.connect();
connect();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/', rideroutes);

module.exports = app;
