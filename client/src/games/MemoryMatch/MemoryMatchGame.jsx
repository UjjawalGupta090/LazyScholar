import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle } from 'lucide-react';

const ICONS_EXTENDED = ['👾', '🎮', '💾', '🕹', '📀', '🖥', '🔌', '🎲', '🦖', '👽', '🛸', '🚀', '🤖', '🔋', '🏆', '💎', '🔑', '🎯'];

const MemoryMatchGame = ({ gameState, setGameState, score, setScore, durationSeconds, setDurationSeconds, onSaveScore }) => {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [movesCount, setMovesCount] = useState(0);

  const [difficultySelected, setDifficultySelected] = useState(false);
  const [difficultySetting, setDifficultySetting] = useState('medium'); // 'easy' | 'medium' | 'hard'

  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  // Stable callbacks refs to prevent loop tearing down
  const onSaveScoreRef = useRef(onSaveScore);
  const setScoreRef = useRef(setScore);
  const setGameStateRef = useRef(setGameState);

  useEffect(() => { onSaveScoreRef.current = onSaveScore; }, [onSaveScore]);
  useEffect(() => { setScoreRef.current = setScore; }, [setScore]);
  useEffect(() => { setGameStateRef.current = setGameState; }, [setGameState]);

  // Audio synthesize chords
  const playSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'flip') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, audioCtx.currentTime); // E4
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'match') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(180, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
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
      }
    } catch (e) {}
  };

  // Timer lifecycle
  useEffect(() => {
    if (gameState !== 'playing' || !difficultySelected) return;

    setDurationSeconds(0);
    elapsedRef.current = 0;

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setDurationSeconds(elapsedRef.current);
      setScoreRef.current(elapsedRef.current);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, difficultySelected, setDurationSeconds]);

  // Initial card shuffle when playing and difficulty is selected
  useEffect(() => {
    if (gameState === 'playing' && difficultySelected) {
      initializeGame();
    }
  }, [gameState, difficultySelected]);

  const initializeGame = () => {
    // Select sub-slice of icons depending on complexity
    let numPairs = 8;
    if (difficultySetting === 'easy') numPairs = 4;
    else if (difficultySetting === 'hard') numPairs = 18;

    const selectedIcons = ICONS_EXTENDED.slice(0, numPairs);
    const list = [...selectedIcons, ...selectedIcons];
    
    // Fisher-Yates Shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    setCards(list);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMovesCount(0);
  };

  const handleCardClick = (idx) => {
    if (gameState !== 'playing') return;
    if (flippedIndices.length >= 2) return;
    if (flippedIndices.includes(idx) || matchedPairs.includes(idx)) return;

    const nextFlipped = [...flippedIndices, idx];
    setFlippedIndices(nextFlipped);
    playSound('flip');

    if (nextFlipped.length === 2) {
      setMovesCount(prev => prev + 1);
      const firstIdx = nextFlipped[0];
      const secondIdx = nextFlipped[1];

      if (cards[firstIdx] === cards[secondIdx]) {
        // Match!
        setTimeout(() => {
          setMatchedPairs(prev => {
            const nextMatch = [...prev, firstIdx, secondIdx];
            playSound('match');
            
            // Check win condition
            if (nextMatch.length === cards.length) {
              if (timerRef.current) clearInterval(timerRef.current);
              playSound('win');
              setTimeout(() => {
                setGameStateRef.current('over');
                onSaveScoreRef.current(elapsedRef.current, elapsedRef.current);
              }, 800);
            }
            return nextMatch;
          });
          setFlippedIndices([]);
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          playSound('fail');
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // Clean state when leaving or gameover
  useEffect(() => {
    if (gameState === 'idle') {
      setDifficultySelected(false);
    }
  }, [gameState]);

  const selectDifficulty = (diff) => {
    setDifficultySetting(diff);
    setDifficultySelected(true);
  };

  if (!difficultySelected) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-6 w-full max-w-sm glass-panel rounded-lg border border-purple-500/10">
        <h3 className="font-display font-black text-base text-[var(--color-neon-cyan)] glow-cyan tracking-wider">SELECT MATRIX SIZE</h3>
        
        <div className="flex flex-col gap-3.5 w-full">
          <button 
            onClick={() => selectDifficulty('easy')}
            className="retro-btn retro-btn-cyan w-full justify-center py-2.5 text-xs"
          >
            EASY MATRIX (4x2 GRID - 8 Cards)
          </button>
          
          <button 
            onClick={() => selectDifficulty('medium')}
            className="retro-btn retro-btn-cyan w-full justify-center py-2.5 text-xs border-glow-cyan"
          >
            MEDIUM MATRIX (4x4 GRID - 16 Cards)
          </button>
          
          <button 
            onClick={() => selectDifficulty('hard')}
            className="retro-btn retro-btn-pink w-full justify-center py-2.5 text-xs"
          >
            HARD MATRIX (6x6 GRID - 36 Cards)
          </button>
        </div>
      </div>
    );
  }

  // Set card size based on difficulty grid scale
  const isHard = difficultySetting === 'hard';
  const isEasy = difficultySetting === 'easy';

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md">
      {/* Board Statistics */}
      <div className="flex justify-between w-full border border-purple-500/15 rounded bg-purple-950/10 px-4 py-2 text-xs">
        <span className="text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">
          Memory Matrix Board ({difficultySetting.toUpperCase()})
        </span>
        <span className="font-bold flex items-center gap-1.5">
          Moves: 
          <span className="font-display text-sm font-black text-[var(--color-neon-cyan)] glow-cyan">
            {movesCount}
          </span>
        </span>
      </div>

      {/* Cards Board Grid */}
      <div 
        className={`grid gap-2 bg-purple-500/5 p-2 rounded-lg border border-purple-500/15 aspect-square max-w-full ${
          isEasy ? 'grid-cols-4 w-[320px] sm:w-[360px] h-[180px] sm:h-[200px] !aspect-auto' :
          isHard ? 'grid-cols-6 w-[360px] sm:w-[400px]' : 
          'grid-cols-4 w-[320px] sm:w-[360px]'
        }`}
      >
        {cards.map((icon, idx) => {
          const isFlipped = flippedIndices.includes(idx) || matchedPairs.includes(idx);
          const isMatched = matchedPairs.includes(idx);

          return (
            <button
              key={idx}
              onClick={() => handleCardClick(idx)}
              className={`w-full h-full rounded border flex items-center justify-center font-bold transition-all duration-300 transform select-none outline-none ${
                isFlipped 
                  ? 'bg-purple-900/30 border-purple-500/30 rotate-y-180' 
                  : 'bg-[#0c0816] border-purple-500/10 hover:border-[var(--color-neon-cyan)] hover:scale-105'
              } ${
                isHard ? 'text-xl sm:text-2xl p-1' : 'text-3xl'
              }`}
            >
              {isFlipped ? (
                <span className={`transition-all duration-150 ${isMatched ? 'opacity-50 scale-95' : 'scale-100'}`}>
                  {icon}
                </span>
              ) : (
                <HelpCircle className={`text-purple-500/30 ${isHard ? 'w-4 h-4' : 'w-5 h-5'}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center text-xs text-[var(--color-text-secondary)] tracking-wider">
        Flip cards and locate matching pairs as fast as possible.
      </div>
    </div>
  );
};

export default MemoryMatchGame;
