import React, { useEffect, useRef } from 'react';

const ConfettiCelebration = ({ isNewRecord, isNewLeaderboard, onClose }) => {
  const canvasRef = useRef(null);

  // Synthesize retro chiptune victory arpeggio chord
  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playTone = (freq, delay, duration, type = 'sine') => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + duration);
      };

      // Play retro C-major arpeggio chime chord
      playTone(261.63, 0.0, 0.15, 'triangle');  // C4
      playTone(329.63, 0.08, 0.15, 'triangle'); // E4
      playTone(392.00, 0.16, 0.15, 'triangle'); // G4
      playTone(523.25, 0.24, 0.45, 'sine');     // C5
      playTone(659.25, 0.32, 0.4, 'sine');      // E5
      playTone(783.99, 0.40, 0.5, 'sine');      // G5
    } catch (e) {
      // Browser autoplay policies might restrict sound on mount
    }
  }, []);

  // Confetti Particle Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Make canvas fill the screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle template
    class Particle {
      constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 6;
        this.color = `hsl(${Math.random() * 360}, 95%, 60%)`;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.gravity = 0.18;
        this.drag = 0.985;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.opacity = 1.0;
        this.fadeSpeed = Math.random() * 0.005 + 0.008;
      }

      update() {
        this.speedX *= this.drag;
        this.speedY *= this.drag;
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        this.opacity -= this.fadeSpeed;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    const particles = [];

    // Fire initial shoots from bottom corners
    const spawnShoots = () => {
      // Bottom-Left shooting up-right
      for (let i = 0; i < 75; i++) {
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.3; // ~ -45 deg
        const speed = Math.random() * 14 + 10;
        particles.push(new Particle(0, canvas.height, angle, speed));
      }
      // Bottom-Right shooting up-left
      for (let i = 0; i < 75; i++) {
        const angle = -3 * Math.PI / 4 + (Math.random() - 0.5) * 0.3; // ~ -135 deg
        const speed = Math.random() * 14 + 10;
        particles.push(new Particle(canvas.width, canvas.height, angle, speed));
      }
    };

    spawnShoots();

    // Additional periodic minor floats from top
    const timer = setInterval(() => {
      if (particles.length < 250) {
        for (let i = 0; i < 5; i++) {
          particles.push(
            new Particle(
              Math.random() * canvas.width,
              -10,
              Math.PI / 2 + (Math.random() - 0.5) * 0.5,
              Math.random() * 2 + 1
            )
          );
        }
      }
    }, 150);

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        
        // Remove offscreen or faded out particles
        if (p.opacity <= 0 || p.y > canvas.height + 20) {
          particles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(timer);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Modal self-destruction timer
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timeout);
  }, [onClose]);

  // Determine banners
  let primaryText = "NEW RECORD DETECTED!";
  let subtitleText = "A personal high score was written to the system registry.";

  if (isNewLeaderboard) {
    primaryText = "GLOBAL LEADERBOARD SECURED!";
    subtitleText = "Congratulations! You have broken into the Global Top 10 rankings.";
  } else if (isNewRecord) {
    primaryText = "NEW PERSONAL BEST SET!";
    subtitleText = "Achievement unlocked: You exceeded your previous record.";
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex flex-col items-center justify-center bg-black/10 select-none animate-fade-in">
      {/* Simulation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Floating Retro Banner */}
      <div 
        onClick={onClose}
        className="pointer-events-auto cursor-pointer glass-panel p-8 max-w-lg w-[90%] border-2 border-yellow-500/40 text-center rounded-lg shadow-2xl shadow-yellow-500/10 animate-scale-up-fade"
      >
        <div className="inline-flex p-3 rounded-full bg-yellow-500/15 text-yellow-400 mb-4 animate-bounce">
          🏆
        </div>
        <h2 className="font-display font-black text-2xl md:text-3xl text-yellow-400 tracking-wider glow-gold uppercase mb-2">
          {primaryText}
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-primary)] leading-relaxed">
          {subtitleText}
        </p>
        <div className="mt-6 text-[10px] text-[var(--color-text-muted)] font-display uppercase tracking-widest animate-pulse">
          Click anywhere to return to Grid
        </div>
      </div>
    </div>
  );
};

export default ConfettiCelebration;
