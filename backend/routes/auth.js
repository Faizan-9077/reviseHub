const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const crypto = require('crypto');

const router = express.Router();



// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({ name, email, passwordHash });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Forgot Password - generates a token and returns a reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If that email exists, reset instructions were sent' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    await user.save();

    const baseURL =
      process.env.NODE_ENV === 'production'
        ? 'https://revise-hub.vercel.app'
        : 'http://localhost:5173';
    const resetLink = `${baseURL}/reset-password?token=${token}`;

    res.json({ message: 'Reset link generated', resetLink });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ message: 'Failed to initiate password reset' });
  }
});


// Reset Password - validates token and updates password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Profile
// Protected profile route
router.get('/profile', authMiddleware, (req, res) => {
    // req.user is now available from middleware
    res.json(req.user);
});


module.exports = router;
