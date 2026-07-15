import React, { useEffect, useRef, useState } from 'react';

const PongGame = ({ gameState, setGameState, score, setScore, durationSeconds, setDurationSeconds, onSaveScore }) => {
  const canvasRef = useRef(null);

  // Game coordinates
  const stateRef = useRef({
    playerY: 150,
    computerY: 150,
    playerHeight: 70,
    playerWidth: 10,
    ballX: 200,
    ballY: 200,
    ballSpeedX: 4,
    ballSpeedY: 2.5,
    ballSize: 8,
    canvasHeight: 380,
    canvasWidth: 480,
    scoreVal: 0,
    elapsedSeconds: 0,
    mouseY: 190
  });

  const [difficultySelected, setDifficultySelected] = useState(false);
  const [difficultySetting, setDifficultySetting] = useState('medium'); // 'easy' | 'medium' | 'hard'

  // Stable callbacks refs to prevent loop tearing down
  const onSaveScoreRef = useRef(onSaveScore);
  const setScoreRef = useRef(setScore);
  const setGameStateRef = useRef(setGameState);

  useEffect(() => { onSaveScoreRef.current = onSaveScore; }, [onSaveScore]);
  useEffect(() => { setScoreRef.current = setScore; }, [setScore]);
  useEffect(() => { setGameStateRef.current = setGameState; }, [setGameState]);

  // Track elapsed match time
  useEffect(() => {
    if (gameState !== 'playing' || !difficultySelected) return;
    
    setDurationSeconds(0);
    stateRef.current.elapsedSeconds = 0;

    const interval = setInterval(() => {
      stateRef.current.elapsedSeconds += 1;
      setDurationSeconds(stateRef.current.elapsedSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, difficultySelected, setDurationSeconds]);

  // Audio synthesis
  const playSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'bounce') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'hit') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  // Keyboard controls
  useEffect(() => {
    if (gameState !== 'playing' || !difficultySelected) return;

    let keyInterval;
    const keysPressed = {};

    const handleKeyDown = (e) => {
      keysPressed[e.key] = true;

      if (!keyInterval) {
        keyInterval = setInterval(() => {
          const state = stateRef.current;
          const paddleSpeed = 8;
          if (keysPressed['ArrowUp'] || keysPressed['w'] || keysPressed['W']) {
            state.playerY = Math.max(0, state.playerY - paddleSpeed);
          }
          if (keysPressed['ArrowDown'] || keysPressed['s'] || keysPressed['S']) {
            state.playerY = Math.min(state.canvasHeight - state.playerHeight, state.playerY + paddleSpeed);
          }
        }, 16);
      }
    };

    const handleKeyUp = (e) => {
      keysPressed[e.key] = false;
      const anyPressed = ['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].some(k => keysPressed[k]);
      if (!anyPressed && keyInterval) {
        clearInterval(keyInterval);
        keyInterval = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (keyInterval) clearInterval(keyInterval);
    };
  }, [gameState, difficultySelected]);

  // Touch and mouse movement capture on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !difficultySelected) return;

    const handleMouseMove = (e) => {
      if (gameState !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      
      const state = stateRef.current;
      state.playerY = Math.max(0, Math.min(state.canvasHeight - state.playerHeight, relativeY - state.playerHeight / 2));
    };

    const handleTouchMove = (e) => {
      if (gameState !== 'playing') return;
      if (e.cancelable) e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const relativeY = e.touches[0].clientY - rect.top;

      const state = stateRef.current;
      state.playerY = Math.max(0, Math.min(state.canvasHeight - state.playerHeight, relativeY - state.playerHeight / 2));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameState, difficultySelected]);

  // Main rendering loop
  useEffect(() => {
    if (gameState !== 'playing' || !difficultySelected) return;

    // Reset scores
    setScoreRef.current(0);
    const state = stateRef.current;
    state.scoreVal = 0;
    state.playerY = 150;
    state.computerY = 150;
    state.ballX = 240;
    state.ballY = 190;

    // Load initial ball speed and computer AI speed metrics based on settings
    let initBallSpeedX = 5.0;
    let initBallSpeedY = 2.8;
    let baseAISpeed = 4.2;

    if (difficultySetting === 'easy') {
      initBallSpeedX = 3.5;
      initBallSpeedY = 1.8;
      baseAISpeed = 2.5;
    } else if (difficultySetting === 'hard') {
      initBallSpeedX = 7.0;
      initBallSpeedY = 4.2;
      baseAISpeed = 6.2;
    }

    state.ballSpeedX = initBallSpeedX;
    state.ballSpeedY = initBallSpeedY;

    let frameId;
    const update = () => {
      // 1. Move Ball
      state.ballX += state.ballSpeedX;
      state.ballY += state.ballSpeedY;

      // 2. Wall Collisions (Top & Bottom)
      if (state.ballY - state.ballSize <= 0) {
        state.ballY = state.ballSize;
        state.ballSpeedY = -state.ballSpeedY;
        playSound('bounce');
      } else if (state.ballY + state.ballSize >= state.canvasHeight) {
        state.ballY = state.canvasHeight - state.ballSize;
        state.ballSpeedY = -state.ballSpeedY;
        playSound('bounce');
      }

      // 3. Computer Paddle Follow AI (interpolated logic)
      const aiCenter = state.computerY + state.playerHeight / 2;
      const diffY = state.ballY - aiCenter;
      
      // Speed scales up slowly as the score grows
      const aiSpeed = Math.min(baseAISpeed + (state.scoreVal * 0.12), baseAISpeed * 1.5);
      
      if (Math.abs(diffY) > 8) {
        if (diffY > 0) {
          state.computerY = Math.min(state.canvasHeight - state.playerHeight, state.computerY + aiSpeed);
        } else {
          state.computerY = Math.max(0, state.computerY - aiSpeed);
        }
      }

      // 4. Ball Collision: Player Paddle (Left Side)
      if (state.ballSpeedX < 0 && state.ballX - state.ballSize <= 25) {
        if (state.ballY >= state.playerY && state.ballY <= state.playerY + state.playerHeight) {
          state.ballX = 25 + state.ballSize;
          
          // Reverse direction + increase speed
          state.ballSpeedX = -state.ballSpeedX * 1.05;
          
          // Calculate angle relative to collision spot on paddle
          const deltaY = state.ballY - (state.playerY + state.playerHeight / 2);
          state.ballSpeedY = deltaY * 0.18 + (Math.random() - 0.5);

          // Update Score
          state.scoreVal += 1;
          setScoreRef.current(state.scoreVal);
          playSound('hit');
        }
      }

      // 5. Ball Collision: Computer Paddle (Right Side)
      if (state.ballSpeedX > 0 && state.ballX + state.ballSize >= state.canvasWidth - 25) {
        if (state.ballY >= state.computerY && state.ballY <= state.computerY + state.playerHeight) {
          state.ballX = state.canvasWidth - 25 - state.ballSize;
          state.ballSpeedX = -state.ballSpeedX;

          const deltaY = state.ballY - (state.computerY + state.playerHeight / 2);
          state.ballSpeedY = deltaY * 0.18 + (Math.random() - 0.5);
          playSound('bounce');
        }
      }

      // 6. Check Game Over (Ball goes off Left / Player misses)
      if (state.ballX < 0) {
        playSound('lose');
        setGameStateRef.current('over');
        onSaveScoreRef.current(state.scoreVal, state.elapsedSeconds);
        return;
      }

      // 7. Bounce back from right edge if computer misses
      if (state.ballX > state.canvasWidth) {
        state.ballX = state.canvasWidth - state.ballSize;
        state.ballSpeedX = -state.ballSpeedX;
        playSound('bounce');
      }

      // Draw frames
      draw();
      frameId = requestAnimationFrame(update);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Clear bg
      ctx.fillStyle = '#06040d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw net line down the middle
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line style

      // Draw Player Paddle (neon cyan)
      ctx.fillStyle = 'hsl(180, 100%, 50%)';
      ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fillRect(15, state.playerY, state.playerWidth, state.playerHeight);

      // Draw Computer Paddle (neon pink)
      ctx.fillStyle = 'hsl(320, 100%, 55%)';
      ctx.shadowColor = 'rgba(255, 0, 220, 0.6)';
      ctx.fillRect(canvas.width - 25, state.computerY, state.playerWidth, state.playerHeight);

      // Draw ball
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, state.ballSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    };

    // Draw first frame
    draw();

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, difficultySelected, difficultySetting]);

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
        <h3 className="font-display font-black text-base text-[var(--color-neon-cyan)] glow-cyan tracking-wider">SELECT PONG DIFFICULTY</h3>
        
        <div className="flex flex-col gap-3.5 w-full">
          <button 
            onClick={() => selectDifficulty('easy')}
            className="retro-btn retro-btn-cyan w-full justify-center py-2.5 text-xs"
          >
            EASY SPEED
          </button>
          
          <button 
            onClick={() => selectDifficulty('medium')}
            className="retro-btn retro-btn-cyan w-full justify-center py-2.5 text-xs border-glow-cyan"
          >
            MEDIUM SPEED
          </button>
          
          <button 
            onClick={() => selectDifficulty('hard')}
            className="retro-btn retro-btn-pink w-full justify-center py-2.5 text-xs"
          >
            HARD SPEED (FAST AI)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <canvas 
        ref={canvasRef} 
        width={480} 
        height={380} 
        className="border border-purple-500/20 max-w-full rounded bg-black cursor-none touch-none"
      />
      <div className="flex justify-between w-[480px] max-w-full text-xs text-[var(--color-text-secondary)]">
        <span>鼠标移动 或 W/S / 方向键</span>
        <span>Drag on Mobile Screen</span>
      </div>
    </div>
  );
};

export default PongGame;
