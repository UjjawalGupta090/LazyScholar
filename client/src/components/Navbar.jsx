import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Trophy, User, LogOut, Cpu, X } from 'lucide-react';

const Navbar = ({ currentUser, onLogout, onOpenAuth, currentPath, navigate, lowPowerMode, setLowPowerMode }) => {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const logoutDialogRef = useRef(null);

  // Sync native HTML5 dialog modal opening/closing
  useEffect(() => {
    const dialog = logoutDialogRef.current;
    if (!dialog) return;

    if (confirmLogout) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [confirmLogout]);

  // Click outside to dismiss modal (light dismiss fallback)
  useEffect(() => {
    const dialog = logoutDialogRef.current;
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
      if (!isDialogContent) setConfirmLogout(false);
    };

    if (!hasClosedBy) {
      dialog.addEventListener('click', handleBackdropClick);
    }
    return () => {
      if (!hasClosedBy) dialog.removeEventListener('click', handleBackdropClick);
    };
  }, []);

  return (
    <nav className="glass-panel sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between border-b border-purple-500/20">
      {/* Brand logo */}
      <div 
        onClick={() => navigate('landing')} 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
      >
        <Gamepad2 className="w-8 h-8 text-[var(--color-neon-cyan)] animate-pulse" />
        <span className="font-display font-extrabold text-xl md:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon-cyan)] to-[var(--color-neon-pink)] glow-cyan">
          LAZY SCHOLAR
        </span>
      </div>

      {/* Nav Menu */}
      <div className="hidden md:flex items-center gap-6">
        <button 
          onClick={() => navigate('landing')} 
          className={`font-display text-sm font-semibold tracking-wider transition ${
            currentPath === 'landing' 
              ? 'text-[var(--color-neon-cyan)] glow-cyan' 
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          GAMES
        </button>

        <button 
          onClick={() => navigate('leaderboard')} 
          className={`font-display text-sm font-semibold tracking-wider transition flex items-center gap-1.5 ${
            currentPath === 'leaderboard' 
              ? 'text-[var(--color-neon-cyan)] glow-cyan' 
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          LEADERBOARD
        </button>

        {currentUser && (
          <button 
            onClick={() => navigate('dashboard')} 
            className={`font-display text-sm font-semibold tracking-wider transition flex items-center gap-1.5 ${
              currentPath === 'dashboard' 
                ? 'text-[var(--color-neon-cyan)] glow-cyan' 
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <User className="w-4 h-4" />
            DASHBOARD
          </button>
        )}
      </div>

      {/* Settings / Auth Actions */}
      <div className="flex items-center gap-4">
        {/* Low power mode toggle button */}
        <button
          onClick={() => setLowPowerMode(!lowPowerMode)}
          className={`p-2 rounded-md border transition-all ${
            lowPowerMode 
              ? 'bg-purple-950/40 text-amber-500 border-amber-500/50' 
              : 'bg-transparent text-[var(--color-text-secondary)] border-purple-500/20 hover:border-purple-500/50 hover:text-white'
          }`}
          title={lowPowerMode ? "Enable 3D Visuals" : "Low Power (Disable 3D)"}
        >
          <Cpu className="w-4 h-4" />
        </button>

        {currentUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">{currentUser.username}</span>
              <span className="text-xs text-[var(--color-text-muted)]">Arcade Champ</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--color-neon-cyan)] to-[var(--color-neon-pink)] p-[1.5px] cursor-pointer animate-fade-in" onClick={() => navigate('dashboard')}>
              <div className="w-full h-full rounded-full bg-[#120e1e] flex items-center justify-center font-display font-bold text-sm text-[var(--color-neon-cyan)]">
                {currentUser.avatarUrl ? (
                  <span className="text-base">{currentUser.avatarUrl}</span>
                ) : (
                  currentUser.username.substring(0, 2).toUpperCase()
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setConfirmLogout(true)} 
              className="p-2 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onOpenAuth('login')} 
              className="px-3.5 py-1.5 text-xs md:text-sm font-semibold text-[var(--color-text-secondary)] hover:text-white transition"
            >
              SIGN IN
            </button>
            <button 
              onClick={() => onOpenAuth('signup')} 
              className="retro-btn retro-btn-cyan !px-4 !py-1.5 !text-xs"
            >
              SIGN UP
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog Modal */}
      <dialog 
        ref={logoutDialogRef}
        closedby="any"
        aria-labelledby="logout-dialog-title"
      >
        <div className="glass-panel text-white rounded-lg p-8 w-full max-w-sm border border-purple-500/30 overflow-hidden text-center">
          <div className="flex justify-between items-center mb-4">
            <h2 id="logout-dialog-title" className="font-display font-extrabold text-lg text-[var(--color-neon-pink)] glow-pink">
              CONFIRM LOGOUT
            </h2>
            <button 
              onClick={() => setConfirmLogout(false)}
              className="p-1 rounded-md hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6">
            Are you sure you want to log out of the Lazy Scholar Grid? Your current session will be cleared.
          </p>

          <div className="flex gap-3">
            <button 
              onClick={() => {
                onLogout();
                setConfirmLogout(false);
              }}
              className="flex-1 retro-btn retro-btn-pink text-xs py-2 justify-center"
            >
              LOG OUT
            </button>
            <button 
              onClick={() => setConfirmLogout(false)}
              className="flex-1 px-4 py-2 text-xs font-bold border border-purple-500/15 hover:border-purple-500/40 rounded text-[var(--color-text-secondary)] hover:text-white transition text-center"
            >
              CANCEL
            </button>
          </div>
        </div>
      </dialog>
    </nav>
  );
};

export default Navbar;
