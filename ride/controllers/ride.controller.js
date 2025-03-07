const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const riderModel = require('../models/ride.model');
const { subscribeToQueue, publishToQueue } = require('../service/rabbit');

module.exports.create = async (req, res, next) => {
    try {
        const { pickup, destination } = req.body;

        const newRide = new riderModel({
            user: req.userId,
            pickup,
            destination
        });
        await newRide.save();
        publishToQueue("new-ride", JSON.stringify(newRide));
        res.send(newRide);
    } catch (error) {
        console.error('Error in create ride controller:', error.message);
        res.status(500).send({ error: error.message });
    }
}

module.exports.acceptRide = async (req, res, next) =>{
    const { rideId } = req.query;

    const ride = await riderModel.findById(rideId);
    if(!ride){
        return res.status(404).send({ message: 'Ride not found' });
    }
    ride.status = 'accepted'
    await ride.save();
    publishToQueue("ride-accepted", JSON.stringify(ride));
    res.send(ride);
}



