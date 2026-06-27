const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ১. REGISTER API (POST: /api/auth/register)
router.post('/register', async (req, res) => {
  try {
    const { name, email, photoURL, password, role } = req.body;

    // চেক করা ইউজার আগে থেকেই আছে কিনা
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email!" });
    }

    // পাসওয়ার্ড এনক্রিপ্ট বা হ্যাশ করা
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // নতুন ইউজার তৈরি করা
    const newUser = new User({
      name,
      email,
      photoURL,
      password: hashedPassword,
      role: role || 'tenant'
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ২. LOGIN API (POST: /api/auth/login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ডাটাবেসে ইউজার খোঁজা
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    // পাসওয়ার্ড ম্যাচ করা
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    // JWT টোকেন তৈরি করা (১ দিনের জন্য ভ্যালিড)
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // রেসপন্সে পাসওয়ার্ড যেন না যায়, তাই আলাদা করা হচ্ছে
    const { password: pass, ...restUserDetails } = user._doc;

    res.status(200).json({ 
      message: "Login successful!", 
      token, 
      user: restUserDetails 
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;