const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ১. আপনার MongoDB লিঙ্ক (পাসওয়ার্ডসহ)
const MONGO_URI = "mongodb+srv://fojikearn:aual%40aual@cluster0.yhqofqf.mongodb.net/?appName=Cluster0"; 

// ২. ডাটাবেজ স্কিমা (এখানে ব্যালেন্স এবং টাস্কের হিসাব থাকবে)
const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    balance: { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 },
    referredBy: String,
    adsWatched: { type: Number, default: 0 },
    completedTasks: { type: Object, default: {} } // টাস্কের হিস্ট্রি রাখার জন্য
});

const User = mongoose.model('User', userSchema);

// ৩. ডাটাবেজ কানেকশন
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.error('Connection Error:', err));

// ৪. ইউজার তৈরি বা ডাটা চেক করার API
app.post('/api/user', async (req, res) => {
    const { userId, referrerId } = req.body;
    try {
        let user = await User.findOne({ userId: String(userId) });
        if (!user) {
            user = new User({ userId: String(userId), referredBy: referrerId });
            await user.save();
            
            // রেফারাল বোনাস (যদি কেউ রেফার লিঙ্কে আসে)
            if (referrerId && referrerId !== userId) {
                await User.findOneAndUpdate(
                    { userId: String(referrerId) },
                    { $inc: { balance: 40, referralCount: 1 } } 
                );
            }
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// ৫. টাকা যোগ করা এবং টাস্ক আপডেট করার API
app.post('/api/add-balance', async (req, res) => {
    const { userId, amount, taskId } = req.body;
    try {
        const updateData = {
            $inc: { balance: amount }
        };

        // যদি এটি কোন বিজ্ঞাপন টাস্ক হয়
        if (taskId && taskId.startsWith('ad-')) {
            updateData.$inc.adsWatched = 1;
            updateData.$set = { [`completedTasks.${taskId}`]: new Date().toDateString() };
        } 
        // যদি এটি টেলিগ্রাম টাস্ক হয়
        else if (taskId === 'telegram_forever') {
            updateData.$set = { [`completedTasks.${taskId}`]: true };
        }

        const user = await User.findOneAndUpdate(
            { userId: String(userId) },
            updateData,
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Balance update failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
