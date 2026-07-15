const mongoose = require('mongoose');

const ScoreLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game: {
    type: String,
    required: true,
    enum: ['snake', 'pong', 'ticTacToe', 'memoryMatch', 'minesweeper']
  },
  score: {
    type: Number,
    required: true
  },
  durationSeconds: {
    type: Number,
    required: true
  },
  playedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ScoreLog', ScoreLogSchema);
