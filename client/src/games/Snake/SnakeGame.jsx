import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

const SnakeGame = ({ gameState, setGameState, score, setScore, durationSeconds, setDurationSeconds, onSaveScore }) => {
  const canvasRef = useRef(null);
  
  // Game metrics
  const gridCount = 20;
  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 5, y: 5 },
    speed: 130, // ms between ticks
    scoreVal: 0,
    elapsedSeconds: 0
  });

  const [speedSelected, setSpeedSelected] = useState(false);
  const [speedSetting, setSpeedSetting] = useState('medium'); // 'slow' | 'medium' | 'fast'

  // Stable callbacks refs to prevent loop tearing down
  const onSaveScoreRef = useRef(onSaveScore);
  const setScoreRef = useRef(setScore);
  const setGameStateRef = useRef(setGameState);

  useEffect(() => { onSaveScoreRef.current = onSaveScore; }, [onSaveScore]);
  useEffect(() => { setScoreRef.current = setScore; }, [setScore]);
  useEffect(() => { setGameStateRef.current = setGameState; }, [setGameState]);

  // Track elapsed time
  useEffect(() => {
    if (gameState !== 'playing' || !speedSelected) return;
    
    setDurationSeconds(0);
    stateRef.current.elapsedSeconds = 0;
    
    const interval = setInterval(() => {
      stateRef.current.elapsedSeconds += 1;
      setDurationSeconds(stateRef.current.elapsedSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, speedSelected, setDurationSeconds]);

  // Audio API for synth chiptune beep sound
  const playSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'eat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.35);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio context may be blocked by browser policies
    }
  };

  // Keyboard control listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || !speedSelected) return;
      const dir = stateRef.current.direction;
      let nextDir = { ...dir };

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dir.y === 0) nextDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dir.y === 0) nextDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dir.x === 0) nextDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dir.x === 0) nextDir = { x: 1, y: 0 };
          break;
      }
      stateRef.current.nextDirection = nextDir;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, speedSelected]);

  // Touch controls for mobile swipes
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (gameState !== 'playing' || !speedSelected) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      const dir = stateRef.current.direction;
      let nextDir = { ...dir };

      // Determine swipe direction if swipe drag threshold met (> 30px)
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) {
          if (diffX > 0 && dir.x === 0) nextDir = { x: 1, y: 0 }; // Right
          else if (diffX < 0 && dir.x === 0) nextDir = { x: -1, y: 0 }; // Left
        }
      } else {
        if (Math.abs(diffY) > 30) {
          if (diffY > 0 && dir.y === 0) nextDir = { x: 0, y: 1 }; // Down
          else if (diffY < 0 && dir.y === 0) nextDir = { x: 0, y: -1 }; // Up
        }
      }
      stateRef.current.nextDirection = nextDir;
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [gameState, speedSelected]);

  // Main game tick loop
  useEffect(() => {
    if (gameState !== 'playing' || !speedSelected) return;

    // Reset game positions
    setScoreRef.current(0);
    stateRef.current.scoreVal = 0;
    stateRef.current.snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    stateRef.current.direction = { x: 0, y: -1 };
    stateRef.current.nextDirection = { x: 0, y: -1 };

    // Select initial base speed based on settings
    let initialTickSpeed = 135;
    if (speedSetting === 'slow') initialTickSpeed = 180;
    else if (speedSetting === 'fast') initialTickSpeed = 90;
    stateRef.current.speed = initialTickSpeed;
    
    // Position food randomly
    const spawnFood = (snake) => {
      let x, y;
      let isOnSnake = true;
      while (isOnSnake) {
        x = Math.floor(Math.random() * gridCount);
        y = Math.floor(Math.random() * gridCount);
        isOnSnake = snake.some(part => part.x === x && part.y === y);
      }
      stateRef.current.food = { x, y };
    };

    spawnFood(stateRef.current.snake);

    let tickTimeout;
    const tick = () => {
      const state = stateRef.current;
      state.direction = state.nextDirection;

      // Calculate head target
      const head = state.snake[0];
      const newHead = {
        x: head.x + state.direction.x,
        y: head.y + state.direction.y
      };

      // Wall hit check
      if (newHead.x < 0 || newHead.x >= gridCount || newHead.y < 0 || newHead.y >= gridCount) {
        playSound('crash');
        setGameStateRef.current('over');
        onSaveScoreRef.current(state.scoreVal, state.elapsedSeconds);
        return;
      }

      // Self hit check
      const selfCrash = state.snake.some(part => part.x === newHead.x && part.y === newHead.y);
      if (selfCrash) {
        playSound('crash');
        setGameStateRef.current('over');
        onSaveScoreRef.current(state.scoreVal, state.elapsedSeconds);
        return;
      }

      // Add new head to tail list
      state.snake.unshift(newHead);

      // Check if food eaten
      if (newHead.x === state.food.x && newHead.y === state.food.y) {
        state.scoreVal += 10;
        setScoreRef.current(state.scoreVal);
        playSound('eat');
        spawnFood(state.snake);
        
        // Speed up the tick loop based on difficulty coefficient
        const speedFactor = speedSetting === 'slow' ? 0.4 : speedSetting === 'fast' ? 0.9 : 0.7;
        state.speed = Math.max(50, initialTickSpeed - (state.scoreVal * speedFactor));
      } else {
        // Remove tip of tail
        state.snake.pop();
      }

      // Draw the scene on frame update
      draw();

      tickTimeout = setTimeout(tick, state.speed);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const state = stateRef.current;
      const cellSize = canvas.width / gridCount;

      // Clear canvas
      ctx.fillStyle = '#06040c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw pixel grid pattern
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
      }

      // Draw food
      ctx.fillStyle = 'hsl(320, 100%, 55%)';
      ctx.shadowColor = 'rgba(255, 0, 220, 0.7)';
      ctx.shadowBlur = 10;
      ctx.fillRect(state.food.x * cellSize + 2, state.food.y * cellSize + 2, cellSize - 4, cellSize - 4);
      ctx.shadowBlur = 0; // reset glow

      // Draw Snake body
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
      state.snake.forEach((part, index) => {
        const ratio = index / state.snake.length;
        ctx.fillStyle = index === 0 ? 'hsl(180, 100%, 50%)' : `hsl(${180 + ratio * 90}, 100%, 50%)`;
        ctx.fillRect(part.x * cellSize + 1, part.y * cellSize + 1, cellSize - 2, cellSize - 2);
      });
      ctx.shadowBlur = 0;
    };

    // Trigger first frame draw
    draw();

    tickTimeout = setTimeout(tick, stateRef.current.speed);

    return () => clearTimeout(tickTimeout);
  }, [gameState, speedSelected, speedSetting]);

  // Clean state when leaving or gameover
  useEffect(() => {
    if (gameState === 'idle') {
      setSpeedSelected(false);
    }
  }, [gameState]);

  const selectSpeed = (selectedSpeed) => {
    setSpeedSetting(selectedSpeed);
    setSpeedSelected(true);
  };

  if (!speedSelected) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-6 w-full max-w-sm glass-panel rounded-lg border border-purple-500/10">
        <h3 className="font-display font-black text-base text-[var(--color-neon-cyan)] glow-cyan tracking-wider">SELECT SNAKE VELOCITY</h3>
        
        <div className="flex flex-col gap-3.5 w-full">
          <button 
            onClick={() => selectSpeed('slow')}
            className="retro-btn retro-btn-cyan w-full justify-center py-2.5 text-xs"
          >
            SLOW SPEED (180ms)
          </button>
          
          <button 
            onClick={() => selectSpeed('medium')}
            className="retro-btn retro-btn-cyan w-full justify-center py-2.5 text-xs border-glow-cyan"
          >
            MEDIUM SPEED (130ms)
          </button>
          
          <button 
            onClick={() => selectSpeed('fast')}
            className="retro-btn retro-btn-pink w-full justify-center py-2.5 text-xs"
          >
            FAST SPEED (90ms)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <canvas 
        ref={canvasRef} 
        width={380} 
        height={380} 
        className="border border-purple-500/20 max-w-full rounded bg-black aspect-square cursor-crosshair"
      />
      <div className="flex justify-between w-[380px] max-w-full text-xs text-[var(--color-text-secondary)]">
        <span>⬅️ ⬆️ ⬇️ ➡ or WASD keys</span>
        <span>Drag / Swipe on Mobile</span>
      </div>
    </div>
  );
};

export default SnakeGame;
