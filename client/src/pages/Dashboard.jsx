import React, { useState, useEffect, useRef } from 'react';
import { User, Calendar, BarChart3, Clock, RotateCcw, AlertTriangle, Edit, X, Mail } from 'lucide-react';

const PRESET_AVATARS = ['👾', '🤖', '🚀', '🛸', '🕹', '💾', '🎮', '🦖'];

const Dashboard = ({ currentUser, onPlayGame, onUpdateUser }) => {
  const [profile, setProfile] = useState(currentUser);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);
  const [error, setError] = useState('');

  // Profile Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');
  const editDialogRef = useRef(null);

  useEffect(() => {
    if (currentUser?.isGuest) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch latest profile
        const profRes = await fetch('http://localhost:5001/api/user/profile', {
          credentials: 'include'
        });
        
        if (!profRes.ok) throw new Error('Failed to load profile details');
        const profData = await profRes.json();
        setProfile(profData);

        // 2. Fetch history for each game and combine them
        const games = ['snake', 'pong', 'ticTacToe', 'memoryMatch'];
        const logsPromises = games.map(async (game) => {
          try {
            const res = await fetch(`http://localhost:5001/api/scores/me/${game}`, {
              credentials: 'include'
            });
            if (!res.ok) return [];
            const data = await res.json();
            return data.history || [];
          } catch {
            return [];
          }
        });

        const allLogsResults = await Promise.all(logsPromises);
        const mergedLogs = allLogsResults
          .flat()
          .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt))
          .slice(0, 10);
        
        setRecentLogs(mergedLogs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  // Sync edit form fields when profile is fetched
  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditEmail(profile.email || '');
      setEditAvatar(profile.avatarUrl || '');
    }
  }, [profile]);

  // Handle native HTML5 dialog modal opening/closing
  useEffect(() => {
    const dialog = editDialogRef.current;
    if (!dialog) return;

    if (isEditModalOpen) {
      if (!dialog.open) dialog.showModal();
      setEditError('');
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isEditModalOpen]);

  // Click outside to dismiss modal (light dismiss fallback)
  useEffect(() => {
    const dialog = editDialogRef.current;
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
      if (!isDialogContent) setIsEditModalOpen(false);
    };

    if (!hasClosedBy) {
      dialog.addEventListener('click', handleBackdropClick);
    }
    return () => {
      if (!hasClosedBy) dialog.removeEventListener('click', handleBackdropClick);
    };
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');
    setSavingProfile(true);

    try {
      const res = await fetch('http://localhost:5001/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUsername,
          email: editEmail,
          avatarUrl: editAvatar
        }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile details');
      }

      setProfile(data.user);
      if (onUpdateUser) {
        onUpdateUser(data.user);
      }
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-[var(--color-text-secondary)]">
        <div className="w-8 h-8 rounded-full border-2 border-t-purple-500 border-r-purple-500/20 border-b-purple-500/20 border-l-purple-500/20 animate-spin" />
        <span className="font-display text-sm font-bold tracking-widest">LOADING STATS MODULE...</span>
      </div>
    );
  }

  if (currentUser?.isGuest) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel rounded-lg p-8 border border-amber-500/30 flex flex-col items-center gap-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
          <h2 className="font-display font-black text-2xl text-amber-500">GUEST TERMINAL</h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            You are currently playing as a Guest. Guest session records are kept temporarily in memory and are not logged persistently. Please sign in to activate your dedicated dashboard, track statistics, and write high scores to the leaderboards.
          </p>
        </div>
      </div>
    );
  }

  const joinDate = profile?.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown Date';

  // Calculate Win rates
  const tttWins = profile?.stats?.ticTacToe?.wins || 0;
  const tttLosses = profile?.stats?.ticTacToe?.losses || 0;
  const tttDraws = profile?.stats?.ticTacToe?.draws || 0;
  const tttTotal = tttWins + tttLosses + tttDraws;
  const tttWinRate = tttTotal > 0 ? Math.round((tttWins / tttTotal) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      {/* Profile Header Card */}
      <header className="glass-panel rounded-lg p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-purple-500/20">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--color-neon-cyan)] to-[var(--color-neon-pink)] p-[2px]">
            <div className="w-full h-full rounded-full bg-[#120e1e] flex items-center justify-center font-display font-black text-2xl text-[var(--color-neon-cyan)] glow-cyan">
              {profile.avatarUrl ? (
                <span className="text-3xl">{profile.avatarUrl}</span>
              ) : (
                profile.username?.substring(0, 2).toUpperCase()
              )}
            </div>
          </div>
          <div>
            <h1 className="font-display font-black text-2xl md:text-3xl tracking-wider text-[var(--color-text-primary)]">
              {profile.username?.toUpperCase()}
            </h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
              <p className="text-xs text-[var(--color-text-muted)] flex items-center justify-center sm:justify-start gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                JOINED: {joinDate}
              </p>
              <span className="hidden sm:inline text-[var(--color-text-muted)]">•</span>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs text-[var(--color-neon-cyan)] hover:text-white flex items-center gap-1 font-bold justify-center sm:justify-start transition"
              >
                <Edit className="w-3 h-3" />
                EDIT PROFILE
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="bg-purple-950/20 border border-purple-500/10 px-4 py-2 rounded text-center">
            <span className="text-[10px] text-[var(--color-text-muted)] block font-bold tracking-widest uppercase">GAMES LOGGED</span>
            <span className="text-xl font-display font-bold text-[var(--color-neon-cyan)] glow-cyan">
              {(profile.stats?.snake?.gamesPlayed || 0) + 
               (profile.stats?.pong?.gamesPlayed || 0) + 
               (profile.stats?.memoryMatch?.gamesPlayed || 0) +
               tttTotal}
            </span>
          </div>
        </div>
      </header>

      {/* Grid of Stats Cards */}
      <section className="mb-8">
        <h2 className="font-display font-black text-lg mb-4 tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[var(--color-neon-cyan)]" />
          GAME PERFORMANCE DECK
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Snake */}
          <div className="glass-card rounded-lg p-5 border border-purple-500/10">
            <span className="text-xs font-bold text-[var(--color-neon-cyan)] tracking-wider font-display">CYBER SNAKE</span>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">High Score:</span>
                <span className="font-display font-bold text-yellow-400">{profile.stats?.snake?.highScore || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">Plays:</span>
                <span className="font-bold">{profile.stats?.snake?.gamesPlayed || 0}</span>
              </div>
            </div>
          </div>

          {/* Pong */}
          <div className="glass-card rounded-lg p-5 border border-purple-500/10">
            <span className="text-xs font-bold text-[var(--color-neon-cyan)] tracking-wider font-display">NEON PONG</span>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">High Score:</span>
                <span className="font-display font-bold text-yellow-400">{profile.stats?.pong?.highScore || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">Plays:</span>
                <span className="font-bold">{profile.stats?.pong?.gamesPlayed || 0}</span>
              </div>
            </div>
          </div>

          {/* Tic Tac Toe */}
          <div className="glass-card rounded-lg p-5 border border-purple-500/10">
            <span className="text-xs font-bold text-[var(--color-neon-pink)] tracking-wider font-display">TIC-TAC-TOE</span>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">W/L/D Record:</span>
                <span className="font-bold text-xs">{tttWins}W - {tttLosses}L - {tttDraws}D</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">Win Ratio:</span>
                <span className="font-display font-bold text-[var(--color-neon-pink)] glow-pink">{tttWinRate}%</span>
              </div>
            </div>
          </div>

          {/* Memory Match */}
          <div className="glass-card rounded-lg p-5 border border-purple-500/10">
            <span className="text-xs font-bold text-[var(--color-neon-pink)] tracking-wider font-display">MEMORY MATCH</span>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">Best Time:</span>
                <span className="font-display font-bold text-yellow-400">
                  {profile.stats?.memoryMatch?.bestTimeSeconds > 0 
                    ? `${profile.stats.memoryMatch.bestTimeSeconds}s` 
                    : 'NONE'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-text-secondary)]">Plays:</span>
                <span className="font-bold">{profile.stats?.memoryMatch?.gamesPlayed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity Table */}
      <section className="glass-panel rounded-lg p-6 border border-purple-500/15">
        <h2 className="font-display font-black text-lg mb-4 tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--color-neon-pink)]" />
          RECENT ACTIVITY LOGS
        </h2>

        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-muted)] text-sm flex flex-col items-center gap-2">
            <RotateCcw className="w-8 h-8 text-[var(--color-text-muted)] animate-spin" />
            No game logs recorded yet. Ready to write history?
            <button 
              onClick={() => onPlayGame('snake')} 
              className="retro-btn retro-btn-cyan text-xs !py-1.5 mt-2"
            >
              LAUNCH CYBER SNAKE
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-purple-500/10 text-[var(--color-text-muted)] uppercase tracking-wider text-[11px] font-bold">
                  <th className="pb-3">Game</th>
                  <th className="pb-3">Result / Score</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Date played</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/5">
                {recentLogs.map((log) => {
                  let formattedGame = log.game === 'snake' ? 'Cyber Snake' 
                    : log.game === 'pong' ? 'Neon Pong' 
                    : log.game === 'ticTacToe' ? 'Tic-Tac-Toe' 
                    : log.game === 'memoryMatch' ? 'Memory Match' 
                    : log.game;
                  
                  let displayScore = '';
                  if (log.game === 'ticTacToe') {
                    displayScore = log.score === 1 ? '🏆 Match Won' : log.score === 0 ? 'Draw' : 'Defeat';
                  } else if (log.game === 'memoryMatch') {
                    displayScore = `${log.score}s (Time)`;
                  } else {
                    displayScore = `${log.score} Points`;
                  }

                  const logDate = new Date(log.playedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={log._id} className="hover:bg-purple-950/10 transition">
                      <td className="py-3 font-semibold text-[var(--color-text-primary)]">{formattedGame}</td>
                      <td className="py-3">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                          log.score > 0 || log.score === 'win' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : log.score < 0 || log.score === 'loss'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-zinc-500/10 text-zinc-400'
                        }`}>
                          {displayScore}
                        </span>
                      </td>
                      <td className="py-3 text-[var(--color-text-secondary)]">{log.durationSeconds}s</td>
                      <td className="py-3 text-xs text-[var(--color-text-muted)]">{logDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Profile Dialog Modal */}
      <dialog 
        ref={editDialogRef}
        closedby="any"
        aria-labelledby="edit-dialog-title"
      >
        <div className="glass-panel text-white rounded-lg p-8 w-full max-w-md border border-purple-500/30 overflow-hidden">
          <div className="flex justify-between items-center mb-5">
            <h2 id="edit-dialog-title" className="font-display font-extrabold text-xl text-[var(--color-neon-cyan)] glow-cyan">
              EDIT PROFILE DATA
            </h2>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="p-1 rounded-md hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {editError && (
            <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              ⚠️ {editError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] tracking-wider">USERNAME</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-purple-400/70" />
                <input 
                  type="text" 
                  required 
                  placeholder="Coin Name" 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full retro-input pl-icon text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] tracking-wider">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-purple-400/70" />
                <input 
                  type="email" 
                  required 
                  placeholder="e.g. gamer@arcade.com" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full retro-input pl-icon text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] tracking-wider">CHOOSE AVATAR</label>
              <div className="grid grid-cols-4 gap-2.5 bg-purple-950/15 p-2.5 rounded border border-purple-500/10">
                {PRESET_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setEditAvatar(avatar)}
                    className={`w-full aspect-square text-2xl flex items-center justify-center rounded border transition duration-150 ${
                      editAvatar === avatar 
                        ? 'border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10 scale-105 shadow-md shadow-cyan-500/10' 
                        : 'border-purple-500/5 bg-black/20 hover:border-purple-500/30'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-purple-500/10 flex gap-3">
              <button 
                type="submit" 
                disabled={savingProfile}
                className="flex-1 retro-btn retro-btn-cyan text-xs py-2 justify-center"
              >
                {savingProfile ? 'SAVING DATA...' : 'SAVE CHANGES'}
              </button>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2 text-xs font-bold border border-purple-500/15 hover:border-purple-500/40 rounded text-[var(--color-text-secondary)] hover:text-white transition text-center"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default Dashboard;
