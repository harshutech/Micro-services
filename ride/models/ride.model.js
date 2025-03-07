const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const RideSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true
    },
    captain: {
        type: Schema.Types.ObjectId,
    },
    pickup: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'started', 'completed'],
        default: 'requested'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ride', RideSchema);