const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'stake', 'unstake', 'withdrawRewards'
    user: { type: String, required: true },
    amount: { type: Number },
    signature: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now },
    blockTime: { type: Number },
});

module.exports = mongoose.model('Event', EventSchema);
