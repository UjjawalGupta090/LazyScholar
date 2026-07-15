const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  passwordHash: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  stats: {
    snake: {
      highScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 }
    },
    ticTacToe: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 }
    },
    pong: {
      highScore: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 }
    },
    memoryMatch: {
      bestTimeSeconds: { type: Number, default: 0 }, // 0 means no record yet
      gamesPlayed: { type: Number, default: 0 }
    },
    minesweeper: {
      bestTimeSeconds: { type: Number, default: 0 }, // 0 means no record yet
      gamesWon: { type: Number, default: 0 }
    }
  }
});

module.exports = mongoose.model('User', UserSchema);
