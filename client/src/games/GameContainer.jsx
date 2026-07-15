import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Home, Info, Trophy, Clock, X } from 'lucide-react';

const GameContainer = ({ gameId, currentUser, onNavigate, children, score, durationSeconds, gameState, setGameState, onRestart, instructionText }) => {
  const [showHowTo, setShowHowTo] = useState(false);
  const dialogRef = useRef(null);

  // Modern Dialog sync for "How to Play" modal
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showHowTo) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [showHowTo]);

  // Handle fallback click outside to dismiss
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const hasClosedBy = 'closedBy' in HTMLDialogElement.prototype;

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isDialogContent) setShowHowTo(false);
    };

    if (!hasClosedBy) {
      dialog.addEventListener('click', handleBackdropClick);
    }
    return () => {
      if (!hasClosedBy) dialog.removeEventListener('click', handleBackdropClick);
    };
  }, []);

  const formattedGameName = gameId === 'snake' ? 'Cyber Snake' 
    : gameId === 'pong' ? 'Neon Pong' 
    : gameId === 'ticTacToe' ? 'Tic-Tac-Toe' 
    : gameId === 'memoryMatch' ? 'Memory Match' 
    : gameId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Game Bar Header */}
      <header className="glass-panel rounded-lg px-4 sm:px-6 py-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 border border-purple-500/20">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('landing')} 
              className="p-2 rounded bg-purple-950/20 hover:bg-purple-950/40 text-[var(--color-text-secondary)] hover:text-white transition"
              title="Main Menu"
            >
              <Home className="w-4 h-4" />
            </button>
            
            <h1 className="font-display font-extrabold text-base md:text-lg tracking-wider text-[var(--color-neon-cyan)] glow-cyan">
              {formattedGameName.toUpperCase()}
            </h1>
          </div>

          {/* Mobile-only Guide button */}
          <button 
            onClick={() => setShowHowTo(true)} 
            className="sm:hidden p-2 rounded bg-purple-950/20 hover:bg-purple-950/40 text-[var(--color-text-secondary)] hover:text-white transition flex items-center gap-1 text-xs font-bold"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time score & timer stats */}
        <div className="flex items-center justify-center sm:justify-start gap-6 font-mono text-sm w-full sm:w-auto border-t border-purple-500/10 pt-2 sm:pt-0 sm:border-t-0">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-[var(--color-text-secondary)]">Score:</span>
            <span className="font-bold text-yellow-400">{score}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[var(--color-neon-pink)]" />
            <span className="text-[var(--color-text-secondary)]">Time:</span>
            <span className="font-bold text-white">{durationSeconds}s</span>
          </div>
        </div>

        {/* Desktop-only Guide button */}
        <button 
          onClick={() => setShowHowTo(true)} 
          className="hidden sm:flex p-2 rounded bg-purple-950/20 hover:bg-purple-950/40 text-[var(--color-text-secondary)] hover:text-white transition items-center gap-1 text-xs font-bold"
        >
          <Info className="w-4 h-4" />
          <span>GUIDE</span>
        </button>
      </header>

      {/* Main Game Frame */}
      <main className="glass-panel rounded-lg border border-purple-500/15 overflow-hidden flex flex-col items-center justify-center min-h-[450px] relative p-4 bg-black/40">
        {gameState === 'idle' && (
          <div className="flex flex-col items-center text-center max-w-sm gap-5 z-10">
            <h2 className="font-display font-black text-2xl text-[var(--color-neon-cyan)] glow-cyan">READY PLAYER ONE</h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {instructionText}
            </p>
            <button 
              onClick={() => setGameState('playing')} 
              className="retro-btn retro-btn-cyan text-sm py-2 px-6"
            >
              <Play className="w-4 h-4 fill-current" />
              START GAME
            </button>
          </div>
        )}

        {gameState === 'playing' && children}

        {gameState === 'paused' && (
          <div className="flex flex-col items-center text-center gap-5 z-10">
            <h2 className="font-display font-black text-2xl text-[var(--color-neon-pink)] glow-pink">GAME PAUSED</h2>
            <button 
              onClick={() => setGameState('playing')} 
              className="retro-btn retro-btn-cyan text-xs"
            >
              RESUME PLAY
            </button>
          </div>
        )}

        {gameState === 'over' && (
          <div className="flex flex-col items-center text-center max-w-sm gap-5 z-10 animate-fade-in">
            <h2 className="font-display font-black text-3xl text-rose-500 glow-pink">GAME OVER</h2>
            <div className="bg-purple-950/20 border border-purple-500/10 rounded-lg p-5 w-full space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">Final Score:</span>
                <span className="font-display font-black text-yellow-400">{score}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">Time Elapsed:</span>
                <span className="font-bold">{durationSeconds}s</span>
              </div>
            </div>
            
            {currentUser?.isGuest && (
              <p className="text-[10px] text-amber-400">
                ⚠️ Log in to save high scores to the global leaderboard.
              </p>
            )}

            <div className="flex gap-4 w-full">
              <button 
                onClick={onRestart} 
                className="retro-btn retro-btn-cyan justify-center flex-1 text-xs"
              >
                <RotateCcw className="w-4 h-4" />
                PLAY AGAIN
              </button>
              <button 
                onClick={() => onNavigate('landing')} 
                className="retro-btn retro-btn-pink justify-center flex-1 text-xs"
              >
                EXIT GRID
              </button>
            </div>
          </div>
        )}
      </main>

      {/* How to Play Dialog */}
      <dialog 
        ref={dialogRef}
        closedby="any"
      >
        <div className="glass-panel text-white rounded-lg p-8 w-full max-w-md border border-purple-500/30 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display font-extrabold text-lg text-[var(--color-neon-cyan)] glow-cyan">
              HOW TO PLAY: {formattedGameName.toUpperCase()}
            </h2>
            <button 
              onClick={() => setShowHowTo(false)}
              className="p-1 rounded-md hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line space-y-2">
            {instructionText}
          </div>
          <button 
            onClick={() => setShowHowTo(false)}
            className="mt-6 w-full retro-btn retro-btn-cyan text-xs justify-center"
          >
            ACKNOWLEDGED
          </button>
        </div>
      </dialog>
    </div>
  );
};

export default GameContainer;
