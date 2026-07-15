const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get logged-in user's profile and statistics
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile details (username, email, avatarUrl)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email, avatarUrl } = req.body;
    const updateFields = {};

    if (username) {
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ message: 'Username must be between 3 and 30 characters' });
      }
      
      // Check if username is already taken by someone else
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      updateFields.username = username;
    }

    if (email) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }

      // Check if email is already taken by someone else
      const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingUserByEmail && existingUserByEmail._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
      updateFields.email = email.toLowerCase();
    }

    if (avatarUrl !== undefined) {
      updateFields.avatarUrl = avatarUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
