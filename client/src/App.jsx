import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ArcadeBackground from './three/ArcadeBackground';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Leaderboards from './pages/Leaderboards';
import ConfettiCelebration from './components/ConfettiCelebration';
import Footer from './components/Footer';

// Game Components
import GameContainer from './games/GameContainer';
import SnakeGame from './games/Snake/SnakeGame';
import TicTacToeGame from './games/TicTacToe/TicTacToeGame';
import PongGame from './games/Pong/PongGame';
import MemoryMatchGame from './games/MemoryMatch/MemoryMatchGame';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001'
  : '';

function App() {
  // Routing & Session states
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPath, setCurrentPath] = useState('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [lowPowerMode, setLowPowerMode] = useState(false);

  // Active Game states
  const [score, setScore] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'paused' | 'over'
  const [celebrationData, setCelebrationData] = useState({
    open: false,
    isNewRecord: false,
    isNewLeaderboard: false
  });

  // Sync route path with browser location hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '') || 'landing';
      setCurrentPath(hash);
      // Reset game states when switching pages
      setGameState('idle');
      setScore(0);
      setDurationSeconds(0);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on startup

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check user credentials session on launch
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include' // send cookies
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error('Session validation error:', err);
      }
    };
    checkSession();
  }, []);

  const navigate = (path) => {
    window.location.hash = `#/${path}`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setCurrentUser(null);
      navigate('landing');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
  };

  const handleOpenAuth = (mode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSaveScore = async (finalScore, duration, result = null) => {
    if (!currentUser || currentUser.isGuest) return;

    const gameName = currentPath.split('/')[1]; // e.g. game/snake -> snake
    try {
      const res = await fetch(`${API_BASE}/api/scores/${gameName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore, durationSeconds: duration, result }),
        credentials: 'include'
      });
      if (res.ok) {
        const scoreData = await res.json();
        if (scoreData.isNewRecord || scoreData.isNewLeaderboard) {
          setCelebrationData({
            open: true,
            isNewRecord: scoreData.isNewRecord,
            isNewLeaderboard: scoreData.isNewLeaderboard
          });
        }

        // Reload user stats silently on success
        const userRes = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include'
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
        }
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    }
  };

  // Game Instructions
  const getGameInstructions = (gameId) => {
    switch (gameId) {
      case 'snake':
        return `CONTROLS: Use the Arrow Keys or WASD to navigate. Swiping on screen is supported on mobile.
        GOAL: Guide the cyber-snake to swallow glowing neon pellets. Each pellet adds 10 points. 
        COLLISION: Hitting the grid walls or your own tail triggers a crash and ends the game. 
        SPEED: The snake's speed scales up continuously as your points accumulate.`;
      case 'ticTacToe':
        return `CONTROLS: Click or tap cells in the 3x3 grid to place your mark.
        GOAL: Connect 3 marks ('X') in a row horizontally, vertically, or diagonally to win.
        SINGLE PLAYER: Plays against the unbeatable minimax computer algorithm. You can switch to Easy mode to practice.
        LOCAL 2P: Play with a friend locally by taking turns.`;
      case 'pong':
        return `CONTROLS: Use W/S, Up/Down arrow keys, or move your mouse vertically. Slide finger on mobile screens.
        GOAL: Bounce the cyber ball back and forth. Scoring is endless and records the count of consecutive paddle deflections.
        COLLISION: Missing the ball ends the game.
        SPEED: The ball velocity and computer AI speed scale up with each bounce deflection.`;
      case 'memoryMatch':
        return `CONTROLS: Click/tap card boxes to flip them and reveal the hidden pixel icons.
        GOAL: Find all 8 matching icon pairs.
        SCORE: Lower completion time (seconds) secures a higher place on the leaderboards.`;
      default:
        return 'Insert coin and select start to begin.';
    }
  };

  // Router layout selector
  const renderPage = () => {
    if (currentPath === 'landing') {
      return (
        <LandingPage 
          currentUser={currentUser} 
          onPlayGame={(id) => navigate(`game/${id}`)}
          onOpenAuth={handleOpenAuth}
        />
      );
    }

    if (currentPath === 'dashboard') {
      return (
        <Dashboard 
          currentUser={currentUser} 
          onPlayGame={(id) => navigate(`game/${id}`)}
          onUpdateUser={setCurrentUser}
        />
      );
    }

    if (currentPath === 'leaderboard') {
      return <Leaderboards />;
    }

    if (currentPath.startsWith('game/')) {
      const gameId = currentPath.split('/')[1];
      const instText = getGameInstructions(gameId);

      return (
        <GameContainer
          gameId={gameId}
          currentUser={currentUser}
          onNavigate={navigate}
          score={score}
          durationSeconds={durationSeconds}
          gameState={gameState}
          setGameState={setGameState}
          instructionText={instText}
          onRestart={() => setGameState('playing')}
        >
          {gameId === 'snake' && (
            <SnakeGame
              gameState={gameState}
              setGameState={setGameState}
              score={score}
              setScore={setScore}
              durationSeconds={durationSeconds}
              setDurationSeconds={setDurationSeconds}
              onSaveScore={handleSaveScore}
            />
          )}
          {gameId === 'ticTacToe' && (
            <TicTacToeGame
              gameState={gameState}
              setGameState={setGameState}
              score={score}
              setScore={setScore}
              durationSeconds={durationSeconds}
              setDurationSeconds={setDurationSeconds}
              onSaveScore={handleSaveScore}
            />
          )}
          {gameId === 'pong' && (
            <PongGame
              gameState={gameState}
              setGameState={setGameState}
              score={score}
              setScore={setScore}
              durationSeconds={durationSeconds}
              setDurationSeconds={setDurationSeconds}
              onSaveScore={handleSaveScore}
            />
          )}
          {gameId === 'memoryMatch' && (
            <MemoryMatchGame
              gameState={gameState}
              setGameState={setGameState}
              score={score}
              setScore={setScore}
              durationSeconds={durationSeconds}
              setDurationSeconds={setDurationSeconds}
              onSaveScore={handleSaveScore}
            />
          )}
        </GameContainer>
      );
    }

    // Default route
    return <LandingPage currentUser={currentUser} onPlayGame={(id) => navigate(`game/${id}`)} onOpenAuth={handleOpenAuth} />;
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* 3D WebGL background */}
      <ArcadeBackground path={currentPath} lowPowerMode={lowPowerMode} />
      
      {/* Scanline CRT overlay */}
      <div className="scanlines" />

      {/* Main UI layout */}
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onOpenAuth={handleOpenAuth} 
        currentPath={currentPath} 
        navigate={navigate}
        lowPowerMode={lowPowerMode}
        setLowPowerMode={setLowPowerMode}
      />

      <div className="flex-1 w-full relative z-10">
        {renderPage()}
      </div>

      <Footer 
        onNavigate={navigate} 
        currentPath={currentPath} 
        currentUser={currentUser} 
      />

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        mode={authModalMode}
        setMode={setAuthModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {celebrationData.open && (
        <ConfettiCelebration
          isNewRecord={celebrationData.isNewRecord}
          isNewLeaderboard={celebrationData.isNewLeaderboard}
          onClose={() => setCelebrationData(prev => ({ ...prev, open: false }))}
        />
      )}
    </div>
  );
}

export default App;
