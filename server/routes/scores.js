const express = require('express');
const ScoreLog = require('../models/ScoreLog');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const VALID_GAMES = ['snake', 'pong', 'ticTacToe', 'memoryMatch', 'minesweeper'];

// @route   POST /api/scores/:game
// @desc    Submit score for a game and update user stats
// Helper to check the current top 10 leaderboard threshold
const getDeduplicatedLeaderboardList = async (game) => {
  const isTimeBased = ['memoryMatch', 'minesweeper'].includes(game);
  const sortOrder = isTimeBased ? 1 : -1;
  const filter = { game };
  if (isTimeBased) filter.score = { $gt: 0 };
  
  if (game === 'ticTacToe') {
    const topUsers = await User.find({ 'stats.ticTacToe.wins': { $gt: 0 } })
      .sort({ 'stats.ticTacToe.wins': -1 })
      .limit(10);
    return topUsers.map(u => ({ rawScore: u.stats.ticTacToe.wins }));
  }

  const rawLogs = await ScoreLog.find(filter).populate('userId', 'username');
  const userBestScores = {};
  rawLogs.forEach(log => {
    if (!log.userId) return;
    const uId = log.userId._id.toString();
    const currentBest = userBestScores[uId];
    if (!currentBest) {
      userBestScores[uId] = log;
    } else {
      if (isTimeBased) {
        if (log.score < currentBest.score) userBestScores[uId] = log;
      } else {
        if (log.score > currentBest.score) userBestScores[uId] = log;
      }
    }
  });

  return Object.values(userBestScores)
    .sort((a, b) => isTimeBased ? a.score - b.score : b.score - a.score)
    .slice(0, 10)
    .map(log => ({ rawScore: log.score }));
};

// @route   POST /api/scores/:game
// @desc    Submit score for a game and update user stats
router.post('/:game', authMiddleware, async (req, res) => {
  try {
    const { game } = req.params;
    const { score, durationSeconds, result } = req.body;

    if (!VALID_GAMES.includes(game)) {
      return res.status(400).json({ message: 'Invalid game name' });
    }

    if (durationSeconds === undefined || typeof durationSeconds !== 'number' || durationSeconds < 0) {
      return res.status(400).json({ message: 'Valid duration is required' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Server-side validation of scores
    if (game === 'snake') {
      if (score === undefined || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ message: 'Invalid score' });
      }
      if (score > durationSeconds * 5 + 10) {
        return res.status(400).json({ message: 'Score validation failed (impossible score rate)' });
      }
    } 
    else if (game === 'pong') {
      if (score === undefined || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ message: 'Invalid score' });
      }
      if (score > durationSeconds / 2 + 10) {
        return res.status(400).json({ message: 'Score validation failed (impossible score rate)' });
      }
    } 
    else if (game === 'ticTacToe') {
      if (!['win', 'loss', 'draw'].includes(result)) {
        return res.status(400).json({ message: 'Valid match result required for Tic-Tac-Toe' });
      }
    } 
    else if (game === 'memoryMatch') {
      if (score === undefined || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ message: 'Invalid completion time' });
      }
      if (score < 4 && score > 0) {
        return res.status(400).json({ message: 'Score validation failed (impossible speed)' });
      }
    }

    // Check if they broke into the top 10 leaderboard BEFORE updating this score log
    let isNewLeaderboard = false;
    try {
      const currentLeaderboard = await getDeduplicatedLeaderboardList(game);
      if (currentLeaderboard.length < 10) {
        if (game === 'ticTacToe') {
          if (result === 'win') isNewLeaderboard = true;
        } else {
          isNewLeaderboard = score > 0;
        }
      } else {
        const thresholdScore = currentLeaderboard[9].rawScore;
        if (game === 'memoryMatch') {
          if (score > 0 && score < thresholdScore) isNewLeaderboard = true;
        } else if (game === 'ticTacToe') {
          const nextWins = user.stats.ticTacToe.wins + (result === 'win' ? 1 : 0);
          if (nextWins > thresholdScore) isNewLeaderboard = true;
        } else {
          if (score > thresholdScore) isNewLeaderboard = true;
        }
      }
    } catch (e) {
      console.error('Leaderboard calculation failed:', e);
    }

    let isNewRecord = false;

    // Apply updates and check personal bests
    if (game === 'snake') {
      const previousHighScore = user.stats.snake.highScore;
      user.stats.snake.gamesPlayed += 1;
      if (score > previousHighScore) {
        isNewRecord = true;
        user.stats.snake.highScore = score;
      }
    } 
    else if (game === 'pong') {
      const previousHighScore = user.stats.pong.highScore;
      user.stats.pong.gamesPlayed += 1;
      if (score > previousHighScore) {
        isNewRecord = true;
        user.stats.pong.highScore = score;
      }
    } 
    else if (game === 'ticTacToe') {
      if (result === 'win') {
        isNewRecord = true; // Winning matches is celebrated
        user.stats.ticTacToe.wins += 1;
      } else if (result === 'loss') {
        user.stats.ticTacToe.losses += 1;
      } else {
        user.stats.ticTacToe.draws += 1;
      }
    } 
    else if (game === 'memoryMatch') {
      const previousBest = user.stats.memoryMatch.bestTimeSeconds;
      user.stats.memoryMatch.gamesPlayed += 1;
      if (score > 0) {
        if (previousBest === 0 || score < previousBest) {
          isNewRecord = true;
          user.stats.memoryMatch.bestTimeSeconds = score;
        }
      }
    } 
    else if (game === 'minesweeper') {
      if (result === 'win') {
        user.stats.minesweeper.gamesWon += 1;
        const previousBest = user.stats.minesweeper.bestTimeSeconds;
        if (score > 0) {
          if (previousBest === 0 || score < previousBest) {
            isNewRecord = true;
            user.stats.minesweeper.bestTimeSeconds = score;
          }
        }
      }
    }

    await user.save();

    // Log the score
    const newLog = new ScoreLog({
      userId,
      game,
      score: game === 'ticTacToe' ? (result === 'win' ? 1 : result === 'draw' ? 0 : -1) : score,
      durationSeconds
    });

    await newLog.save();

    res.status(201).json({
      message: 'Score submitted successfully',
      stats: user.stats[game],
      log: newLog,
      isNewRecord,
      isNewLeaderboard
    });

  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({ message: 'Server error submitting score' });
  }
});

// @route   GET /api/scores/:game/top
// @desc    Get top 10 leaderboard for a specific game
router.get('/:game/top', async (req, res) => {
  try {
    const { game } = req.params;

    if (!VALID_GAMES.includes(game)) {
      return res.status(400).json({ message: 'Invalid game name' });
    }

    // Special handling for Tic-Tac-Toe: Query users sorted by wins
    if (game === 'ticTacToe') {
      const topUsers = await User.find({ 'stats.ticTacToe.wins': { $gt: 0 } })
        .sort({ 'stats.ticTacToe.wins': -1 })
        .limit(10)
        .select('username avatarUrl stats.ticTacToe');

      const leaderboard = topUsers.map((u, idx) => ({
        rank: idx + 1,
        username: u.username,
        avatarUrl: u.avatarUrl,
        metric: `${u.stats.ticTacToe.wins} Wins (${u.stats.ticTacToe.losses}L, ${u.stats.ticTacToe.draws}D)`,
        rawScore: u.stats.ticTacToe.wins
      }));

      return res.json({ leaderboard });
    }

    // For memoryMatch or minesweeper, lower time is better (ASC)
    // For snake or pong, higher score is better (DESC)
    const isTimeBased = ['memoryMatch', 'minesweeper'].includes(game);
    const sortOrder = isTimeBased ? 1 : -1;
    const filter = { game };

    if (isTimeBased) {
      // Exclude 0 score/time logs
      filter.score = { $gt: 0 };
    }

    // Find logs, sort, and limit to 10
    const topLogs = await ScoreLog.find(filter)
      .sort({ score: sortOrder })
      .limit(10)
      .populate('userId', 'username avatarUrl');

    // Deduplicate so each user appears only once on the leaderboard
    // (Optional, but usually better for game leaderboards. Let's do it by taking the best score per user)
    const userBestScores = {};
    const rawLogs = await ScoreLog.find(filter)
      .populate('userId', 'username avatarUrl');

    rawLogs.forEach(log => {
      if (!log.userId) return; // User might have been deleted
      const uId = log.userId._id.toString();
      const currentBest = userBestScores[uId];
      if (!currentBest) {
        userBestScores[uId] = log;
      } else {
        if (isTimeBased) {
          if (log.score < currentBest.score) {
            userBestScores[uId] = log;
          }
        } else {
          if (log.score > currentBest.score) {
            userBestScores[uId] = log;
          }
        }
      }
    });

    const deduplicatedList = Object.values(userBestScores)
      .sort((a, b) => isTimeBased ? a.score - b.score : b.score - a.score)
      .slice(0, 10);

    const leaderboard = deduplicatedList.map((log, idx) => ({
      rank: idx + 1,
      username: log.userId.username,
      avatarUrl: log.userId.avatarUrl,
      metric: isTimeBased ? `${log.score} Seconds` : `${log.score} Points`,
      rawScore: log.score,
      playedAt: log.playedAt
    }));

    res.json({ leaderboard });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error retrieving leaderboard' });
  }
});

// @route   GET /api/scores/me/:game
// @desc    Get logged-in user's score logs for a specific game
router.get('/me/:game', authMiddleware, async (req, res) => {
  try {
    const { game } = req.params;
    const userId = req.user.id;

    if (!VALID_GAMES.includes(game)) {
      return res.status(400).json({ message: 'Invalid game name' });
    }

    const history = await ScoreLog.find({ userId, game })
      .sort({ playedAt: -1 })
      .limit(20);

    res.json({ history });

  } catch (error) {
    console.error('Get score history error:', error);
    res.status(500).json({ message: 'Server error retrieving history' });
  }
});

module.exports = router;
