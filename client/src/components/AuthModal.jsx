import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, User, X, KeyRound } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, mode, setMode, onAuthSuccess }) => {
  const dialogRef = useRef(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync open/close state of HTML5 dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setError('');
        setEmail('');
        setUsername('');
        setPassword('');
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Fallback listener for backdrop click (light-dismiss) in older/unsupported browsers
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Check if browser natively supports closedby="any"
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

      if (!isDialogContent) {
        onClose();
      }
    };

    if (!hasClosedBy) {
      dialog.addEventListener('click', handleBackdropClick);
    }

    // Capture ESC key or native cancel request to sync state with parent
    const handleCancel = (e) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);

    return () => {
      if (!hasClosedBy) {
        dialog.removeEventListener('click', handleBackdropClick);
      }
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const apiPath = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' 
      ? { email, password } 
      : { username, email, password };

    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : '';

    try {
      const res = await fetch(`${API_BASE}${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const playAsGuest = () => {
    onAuthSuccess({ username: 'Player1', isGuest: true });
    onClose();
  };

  return (
    <dialog 
      ref={dialogRef} 
      closedby="any"
      aria-labelledby="modal-title"
    >
      <div className="glass-panel text-white rounded-lg p-8 w-full max-w-md border border-purple-500/30 flex flex-col gap-1.5 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="font-display font-extrabold text-xl md:text-2xl text-[var(--color-neon-cyan)] glow-cyan">
            {mode === 'login' ? 'RETRO LOGIN' : 'CREATING CHAMPION'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex gap-2 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] tracking-wider">USERNAME</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-purple-400/70" />
                <input 
                  type="text" 
                  required 
                  placeholder="Insert coin name" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full retro-input pl-icon text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--color-text-secondary)] tracking-wider">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-purple-400/70" />
              <input 
                type="email" 
                required 
                placeholder="e.g. gamer@arcade.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full retro-input pl-icon text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--color-text-secondary)] tracking-wider">PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-purple-400/70" />
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full retro-input pl-icon text-sm"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full retro-btn retro-btn-cyan justify-center py-2.5 mt-2 text-sm text-center"
          >
            {loading ? 'PROCESSING...' : mode === 'login' ? 'INSERT COIN (LOGIN)' : 'INITIALIZE PROFILE'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-purple-500/10 flex flex-col gap-3 text-center">
          <span className="text-xs text-[var(--color-text-muted)]">
            {mode === 'login' ? "New player around here?" : "Already registered as a champ?"}
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[var(--color-neon-pink)] font-semibold ml-1.5 hover:underline"
            >
              {mode === 'login' ? 'CREATE PROFILE' : 'SIGN IN'}
            </button>
          </span>

          <button 
            onClick={playAsGuest}
            className="w-full retro-btn retro-btn-pink justify-center py-2 text-xs"
          >
            PLAY AS GUEST
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default AuthModal;
