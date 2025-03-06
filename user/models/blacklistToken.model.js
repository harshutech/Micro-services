const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const BlacklistTokenSchema = new Schema({
    token: { type: String, required: true }
});  


module.exports = mongoose.model('BlacklistToken', BlacklistTokenSchema);    