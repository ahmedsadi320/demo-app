const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ১. ডাটাবেজ কানেকশন
const MONGO_URI = "mongodb+srv://fojikearn:aual%40aual@cluster0.yhqofqf.mongodb.net/?appName=Cluster0"; 
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.error('Connection Error:', err));

// ২. ইউজার স্কিমা
const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    balance: { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 },
    referredBy: { type: String, default: "none" },
    adsWatched: { type: Number, default: 0 },
    completedTasks: { type: Object, default: {} }
});
const User = mongoose.model('User', userSchema);

// ৩. ইউজার তৈরি ও রেফারেল বোনাস লজিক (এটিই মেইন সমস্যা ছিল)
app.post('/api/user', async (req, res) => {
    const { userId, referrerId } = req.body;
    const currentUserId = String(userId);
    const inviterId = (referrerId && referrerId !== currentUserId) ? String(referrerId) : null;

    try {
        let user = await User.findOne({ userId: currentUserId });

        if (!user) {
            // নতুন ইউজার ডাটাবেজে সেভ করার আগেই রেফারারকে বোনাস দিতে হবে
            console.log(`New user detected: ${currentUserId}`);
            
            user = new User({ 
                userId: currentUserId, 
                referredBy: inviterId || "none"
            });
            await user.save();

            // বোনাস দেওয়ার অংশ
            if (inviterId) {
                const bonusResult = await User.findOneAndUpdate(
                    { userId: inviterId },
                    { $inc: { balance: 40, referralCount: 1 } },
                    { new: true }
                );
                if (bonusResult) {
                    console.log(`SUCCESS: 40 Taka added to inviter ${inviterId}`);
                } else {
                    console.log(`FAILED: Inviter ${inviterId} not found in database.`);
                }
            }
        }
        res.json(user);
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// ৪. ব্যালেন্স আপডেট API
app.post('/api/add-balance', async (req, res) => {
    const { userId, amount, taskId } = req.body;
    try {
        const update = { $inc: { balance: amount } };
        if (taskId && taskId.startsWith('ad-')) {
            update.$inc.adsWatched = 1;
            update.$set = { [`completedTasks.${taskId}`]: new Date().toDateString() };
        }
        const user = await User.findOneAndUpdate({ userId: String(userId) }, update, { new: true });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
