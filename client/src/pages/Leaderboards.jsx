import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Star } from 'lucide-react';

const Leaderboards = () => {
  const [activeTab, setActiveTab] = useState('snake');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'snake', name: 'CYBER SNAKE' },
    { id: 'pong', name: 'NEON PONG' },
    { id: 'ticTacToe', name: 'TIC-TAC-TOE' },
    { id: 'memoryMatch', name: 'MEMORY MATCH' }
  ];

  const fetchLeaderboard = async (gameId) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`http://localhost:5001/api/scores/${gameId}/top`);
      if (!res.ok) {
        throw new Error('Failed to retrieve leaderboard data');
      }
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <header className="text-center mb-10 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-4 shadow-lg shadow-yellow-500/10">
          <Trophy className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="font-display font-black text-3xl md:text-4xl tracking-wider text-[var(--color-text-primary)] mb-2">
          GLOBAL HALL OF FAME
        </h1>
        <p className="text-xs md:text-sm text-[var(--color-text-secondary)]">
          Real-time top 10 rankings of the absolute best arcade operators across all grids.
        </p>
      </header>

      {/* Tab Switcher */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`font-display text-xs font-bold tracking-wider px-4 py-2 border rounded-md transition ${
              activeTab === tab.id
                ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/5 shadow-inner'
                : 'border-purple-500/10 text-[var(--color-text-secondary)] hover:text-white hover:border-purple-500/30'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Leaderboard Table Panel */}
      <div className="glass-panel rounded-lg p-6 border border-purple-500/15">
        {/* Card Header */}
        <div className="flex justify-between items-center mb-6 border-b border-purple-500/10 pb-3">
          <h3 className="font-display font-black text-xs md:text-sm tracking-widest text-[var(--color-neon-cyan)] glow-cyan">
            {tabs.find(t => t.id === activeTab)?.name} RANKINGS
          </h3>
          <button
            onClick={() => fetchLeaderboard(activeTab)}
            className="px-3 py-1.5 text-[var(--color-text-secondary)] hover:text-white rounded border border-purple-500/20 hover:border-purple-500/40 bg-purple-950/30 hover:bg-purple-950/50 transition flex items-center gap-1.5 text-[10px] font-bold font-display tracking-wider"
            title="Reload Leaderboard"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)] text-sm">
            <div className="w-6 h-6 rounded-full border-2 border-t-[var(--color-neon-cyan)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <span className="font-display font-bold tracking-widest text-xs">SYNCHRONIZING LEADERBOARD...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 text-sm">
            ⚠️ Connection error: {error}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-text-muted)] text-sm">
            This leaderboard is empty. Make a new play to secure the first place!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-500/10 text-[var(--color-text-muted)] text-[10px] uppercase font-bold tracking-widest">
                  <th className="pb-3 w-16 text-center">Rank</th>
                  <th className="pb-3">Player</th>
                  <th className="pb-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/5">
                {leaderboard.map((row, idx) => {
                  let isTop3 = row.rank <= 3;
                  let rankColor = row.rank === 1 ? 'text-yellow-400 glow-gold'
                    : row.rank === 2 ? 'text-zinc-300'
                    : row.rank === 3 ? 'text-amber-600'
                    : 'text-[var(--color-text-secondary)]';

                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-purple-950/10 transition ${
                        row.rank === 1 ? 'bg-yellow-500/5' : ''
                      }`}
                    >
                      <td className="py-4 text-center font-display font-black text-sm">
                        <span className={`inline-flex items-center gap-1 ${rankColor}`}>
                          {row.rank === 1 && <Star className="w-3.5 h-3.5 fill-current animate-pulse" />}
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-900 p-[1.5px]">
                            <div className="w-full h-full rounded-full bg-[#120e1e] flex items-center justify-center font-display text-xs text-[var(--color-neon-cyan)]">
                              {row.username.substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                          <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                            {row.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <span className="font-display font-bold text-sm text-yellow-400">
                          {row.metric}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboards;
