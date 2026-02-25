const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ১. আপনার সাজানো MongoDB লিঙ্কটি নিচের কোটেশনের ভেতর বসান
const MONGO_URI = "mongodb+srv://fojikearn:aual@aual@cluster0.yhqofqf.mongodb.net/?appName=Cluster0"; 
// উপরে <db_password> কেটে আপনার আসল পাসওয়ার্ড দিন

const BOT_TOKEN = "8740191296:AAELPLQaCwWxtQeZFvMVeNdM3Gvnt_zYFK8";

const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    balance: { type: Number, default: 0 },
    referredBy: String,
    referralCount: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected!'))
    .catch(err => console.error('Error:', err));

app.post('/api/user', async (req, res) => {
    const { userId, referrerId } = req.body;
    try {
        let user = await User.findOne({ userId });
        if (!user) {
            user = new User({ userId, referredBy: referrerId });
            await user.save();
            if (referrerId) {
                await User.findOneAndUpdate(
                    { userId: referrerId },
                    { $inc: { balance: 10, referralCount: 1 } }
                );
            }
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
