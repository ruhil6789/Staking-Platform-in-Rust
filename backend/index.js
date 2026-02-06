const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { PORT, MONGODB_URI } = require('./config');
const { startListener } = require('./solanaListener');
const Event = require('./models/Event');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB with reconnection logic
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        startListener();
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('Retrying in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

connectDB();

// API Endpoints
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ timestamp: -1 }).limit(50);
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalStakedEvents = await Event.countDocuments({ type: 'stake' });
        const totalUnstakedEvents = await Event.countDocuments({ type: 'unstake' });
        res.json({ totalStakedEvents, totalUnstakedEvents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Manual save endpoint for frontend to save transactions
app.post('/api/events', async (req, res) => {
    try {
        const { type, user, signature, amount, blockTime } = req.body;
        
        if (!type || !user || !signature) {
            return res.status(400).json({ error: 'Missing required fields: type, user, signature' });
        }

        // Check if event already exists
        const existing = await Event.findOne({ signature });
        if (existing) {
            // Update amount if it's missing and we have a new amount
            if (!existing.amount && amount) {
                existing.amount = amount;
                await existing.save();
                console.log(`💾 Updated amount for existing event: ${signature.slice(0, 8)}... = ${amount}`);
                return res.json({ message: 'Event updated with amount', event: existing });
            }
            return res.json({ message: 'Event already exists', event: existing });
        }

        const event = new Event({
            type,
            user,
            signature,
            amount: amount || null,
            blockTime: blockTime || null,
        });

        await event.save();
        console.log(`💾 Manually saved ${type} event: ${signature.slice(0, 8)}...`);
        res.json({ message: 'Event saved successfully', event });
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate key error
            return res.json({ message: 'Event already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
