import React, { useState, useEffect, useRef } from 'react';
import { User, Cpu, Users } from 'lucide-react';

const TicTacToeGame = ({ gameState, setGameState, score, setScore, durationSeconds, setDurationSeconds, onSaveScore }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // Player X always starts (Human)
  const [mode, setMode] = useState(null); // 'vs_computer' or 'local_2p'
  const [difficulty, setDifficulty] = useState('hard'); // 'easy' or 'hard'
  const [winner, setWinner] = useState(null); // 'X', 'O', 'draw' or null
  
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  // Sound effect handler
  const playSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'x') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'o') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(554.37, audioCtx.currentTime); // C#5
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.24); // C6
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === 'draw') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {}
  };

  // Start game timer
  useEffect(() => {
    if (gameState !== 'playing' || !mode) return;

    setDurationSeconds(0);
    elapsedRef.current = 0;

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setDurationSeconds(elapsedRef.current);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, mode, setDurationSeconds]);

  // Check board status on update
  useEffect(() => {
    if (!mode || winner) return;

    const gameWinner = calculateWinner(board);
    if (gameWinner) {
      setWinner(gameWinner);
      handleGameOver(gameWinner);
      return;
    }

    // Check draw
    if (board.every(cell => cell !== null)) {
      setWinner('draw');
      handleGameOver('draw');
      return;
    }

    // Minimax Trigger: Computer Turn
    if (mode === 'vs_computer' && !isXNext) {
      const computerMoveTimeout = setTimeout(() => {
        makeComputerMove();
      }, 400); // Small realistic delay
      return () => clearTimeout(computerMoveTimeout);
    }
  }, [board, isXNext, mode]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleGameOver = (resWinner) => {
    if (timerRef.current) clearInterval(timerRef.current);

    let matchResult = 'draw';
    if (resWinner === 'X') {
      matchResult = 'win';
      playSound('win');
      setScore(1);
    } else if (resWinner === 'O') {
      matchResult = mode === 'vs_computer' ? 'loss' : 'win'; // Local mode winner is another player
      playSound(mode === 'vs_computer' ? 'draw' : 'win');
      setScore(mode === 'vs_computer' ? 0 : 1);
    } else {
      playSound('draw');
      setScore(0);
    }

    setTimeout(() => {
      setGameState('over');
      // Save/Submit match result
      onSaveScore(score, elapsedRef.current, matchResult);
    }, 1200);
  };

  // Minimax Decision making algorithm for AI
  const makeComputerMove = () => {
    let bestIndex = -1;

    const isEasyRandom = difficulty === 'easy' && Math.random() < 0.35;
    const isMediumRandom = difficulty === 'medium' && Math.random() < 0.15;

    if (isEasyRandom || isMediumRandom) {
      // Pick random cell occasionally
      const available = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
      if (available.length > 0) {
        bestIndex = available[Math.floor(Math.random() * available.length)];
      }
    } else {
      // Pure minimax (unbeatable)
      let bestVal = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          const boardCopy = [...board];
          boardCopy[i] = 'O'; // Computer plays O
          const scoreVal = minimax(boardCopy, 0, false);
          if (scoreVal > bestVal) {
            bestVal = scoreVal;
            bestIndex = i;
          }
        }
      }
    }

    if (bestIndex !== -1) {
      const newBoard = [...board];
      newBoard[bestIndex] = 'O';
      setBoard(newBoard);
      playSound('o');
      setIsXNext(true);
    }
  };

  const minimax = (tempBoard, depth, isMaxPlayer) => {
    const scoreVal = evaluateBoard(tempBoard);
    if (scoreVal === 10) return scoreVal - depth; // win fast
    if (scoreVal === -10) return scoreVal + depth; // survive long
    if (tempBoard.every(cell => cell !== null)) return 0; // draw

    if (isMaxPlayer) {
      let maxVal = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempBoard[i] === null) {
          const tempBoardCopy = [...tempBoard];
          tempBoardCopy[i] = 'O';
          const evalScore = minimax(tempBoardCopy, depth + 1, false);
          maxVal = Math.max(maxVal, evalScore);
        }
      }
      return maxVal;
    } else {
      let minVal = Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempBoard[i] === null) {
          const tempBoardCopy = [...tempBoard];
          tempBoardCopy[i] = 'X';
          const evalScore = minimax(tempBoardCopy, depth + 1, true);
          minVal = Math.min(minVal, evalScore);
        }
      }
      return minVal;
    }
  };

  const evaluateBoard = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a] === 'O' ? 10 : -10;
      }
    }
    return 0;
  };

  const handleCellClick = (index) => {
    if (board[index] || winner || gameState !== 'playing') return;
    if (mode === 'vs_computer' && !isXNext) return; // Wait for computer's move

    const currentMark = isXNext ? 'X' : 'O';
    const newBoard = [...board];
    newBoard[index] = currentMark;
    setBoard(newBoard);
    playSound(currentMark.toLowerCase());

    setIsXNext(!isXNext);
  };

  const selectMode = (selectedMode) => {
    setMode(selectedMode);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  // Reset/Restart board
  useEffect(() => {
    if (gameState === 'playing' && mode) {
      setBoard(Array(9).fill(null));
      setIsXNext(true);
      setWinner(null);
    }
  }, [gameState]);

  // Mode Selection Screen
  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-6 w-full max-w-sm">
        <h3 className="font-display font-black text-xl text-[var(--color-neon-cyan)] glow-cyan tracking-wider">CHOOSE MATCH GRID</h3>
        
        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => selectMode('vs_computer')}
            className="retro-btn retro-btn-cyan w-full justify-center flex items-center gap-2 py-3"
          >
            <Cpu className="w-5 h-5" />
            VS COMPUTER (AI)
          </button>
          
          <button 
            onClick={() => selectMode('local_2p')}
            className="retro-btn retro-btn-pink w-full justify-center flex items-center gap-2 py-3"
          >
            <Users className="w-5 h-5" />
            LOCAL 2-PLAYER
          </button>
        </div>

        <div className="flex items-center gap-4 border-t border-purple-500/10 pt-4 w-full justify-between">
          <span className="text-xs text-[var(--color-text-secondary)] font-bold">AI DIFFICULTY:</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setDifficulty('easy')}
              className={`text-xs px-2.5 py-1 rounded font-bold border transition ${
                difficulty === 'easy' 
                  ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10' 
                  : 'border-purple-500/15 text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              EASY
            </button>
            <button 
              onClick={() => setDifficulty('medium')}
              className={`text-xs px-2.5 py-1 rounded font-bold border transition ${
                difficulty === 'medium' 
                  ? 'border-[var(--color-neon-cyan)] border-glow-cyan text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10' 
                  : 'border-purple-500/15 text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              MEDIUM
            </button>
            <button 
              onClick={() => setDifficulty('hard')}
              className={`text-xs px-2.5 py-1 rounded font-bold border transition ${
                difficulty === 'hard' 
                  ? 'border-[var(--color-neon-pink)] text-[var(--color-neon-pink)] bg-[var(--color-neon-pink)]/10' 
                  : 'border-purple-500/15 text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              HARD
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {/* Current Turn Status */}
      <div className="flex items-center justify-between w-full border border-purple-500/15 rounded bg-purple-950/10 px-4 py-2 text-xs">
        <span className="text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">
          {mode === 'vs_computer' ? 'Single Player' : 'Local 2-Player'}
        </span>
        <span className="font-bold flex items-center gap-1.5">
          Active Turn: 
          <span className={`font-display text-sm font-black ${
            isXNext ? 'text-[var(--color-neon-cyan)] glow-cyan' : 'text-[var(--color-neon-pink)] glow-pink'
          }`}>
            {isXNext ? 'X' : 'O'}
          </span>
        </span>
      </div>

      {/* 3x3 Game Board Grid */}
      <div className="grid grid-cols-3 gap-2 bg-purple-500/5 p-2 rounded-lg border border-purple-500/15 w-[300px] h-[300px]">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            className="w-full h-full bg-[#0a0814]/75 border border-purple-500/10 hover:border-purple-500/30 rounded flex items-center justify-center font-display font-black text-4xl transition duration-150 select-none outline-none focus:border-[var(--color-neon-cyan)]"
          >
            <span className={cell === 'X' ? 'text-[var(--color-neon-cyan)] glow-cyan scale-in' : 'text-[var(--color-neon-pink)] glow-pink scale-in'}>
              {cell}
            </span>
          </button>
        ))}
      </div>

      {/* Game termination splash */}
      {winner && (
        <div className="font-display font-black text-center text-sm py-1 tracking-widest animate-pulse">
          {winner === 'draw' ? (
            <span className="text-zinc-400">MATCH ENDED IN A DRAW</span>
          ) : (
            <span className={winner === 'X' ? 'text-[var(--color-neon-cyan)] glow-cyan' : 'text-[var(--color-neon-pink)] glow-pink'}>
              PLAYER {winner} WINS THE BOARD!
            </span>
          )}
        </div>
      )}

      {/* Button to go back to selection screen */}
      <button 
        onClick={() => setMode(null)}
        className="text-xs text-[var(--color-text-secondary)] hover:text-white underline transition mt-2"
      >
        SELECT DIFFERENT GAME GRID
      </button>
    </div>
  );
};

export default TicTacToeGame;
