const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { connectRedis } = require('./utils/cache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Redis/Cache
connectRedis();

// 1. CORS Middleware
app.use(cors({
    origin: [process.env.CLIENT_URL || "https://rent-house-server-eta.vercel.app/"],
    credentials: true
}));

// 🔴 2. ওয়েবহুকের জন্য Raw Body (এটি express.json() এর আগে থাকতে হবে)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// 3. বাকি রাউটের জন্য JSON পার্সার
app.use(express.json());

// Routes Import
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // 🔴 ফাইলের নাম আপডেট করা হয়েছে

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payment', paymentRoutes); // 🔴 পেমেন্ট রাউট কানেক্ট করা হয়েছে

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('HouseNest Backend Server is Running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});