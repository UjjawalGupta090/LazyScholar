import React from 'react';
import { Gamepad2, Swords, ChevronRight, HelpCircle } from 'lucide-react';

const LandingPage = ({ currentUser, onPlayGame, onOpenAuth }) => {
  const games = [
    {
      id: 'snake',
      name: 'CYBER SNAKE',
      desc: 'Evade your own tail, swallow neon nodes, and navigate as speed amplifies dynamically.',
      theme: 'cyan',
      controls: 'Arrow keys / WASD or swipe on mobile.'
    },
    {
      id: 'ticTacToe',
      name: 'TIC-TAC-TOE',
      desc: 'Outsmart the advanced Minimax logic processor in 1P or challenge a friend in 2P local mode.',
      theme: 'pink',
      controls: 'Tap grid squares to place X or O.'
    },
    {
      id: 'pong',
      name: 'NEON PONG',
      desc: 'Deflect high-velocity vectors, adjust angles, and overpower the adaptive computer paddle.',
      theme: 'cyan',
      controls: 'Drag mouse, touch slide, or W/S keys.'
    },
    {
      id: 'memoryMatch',
      name: 'MEMORY MATCH',
      desc: 'Flip early-generation console glyphs and find pairs in the absolute shortest time possible.',
      theme: 'pink',
      controls: 'Click/Tap cards to flip them.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col items-center">
      {/* Hero section */}
      <header className="text-center max-w-2xl mt-6 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-neon-cyan)]/30 bg-[var(--color-neon-cyan)]/5 text-[var(--color-neon-cyan)] text-xs font-bold tracking-widest uppercase mb-4 animate-pulse">
          <Swords className="w-3.5 h-3.5" />
          RETRO ARCADE v1.0.0
        </div>
        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight mb-4 leading-tight">
          Simple games. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon-cyan)] to-[var(--color-neon-pink)] glow-pink">
            Serious nostalgia.
          </span> <br />
          Smart tracking.
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed mt-2">
          Hop into classic 8-bit games directly in your web browser. Monitor your scores, scale the global leaderboard, and track your achievements.
        </p>

        {!currentUser && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => onOpenAuth('signup')} 
              className="retro-btn retro-btn-cyan w-full sm:w-auto justify-center"
            >
              CREATE CHAMPION PROFILE
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onOpenAuth('login')} 
              className="px-6 py-2.5 font-display text-sm font-bold tracking-wide border border-purple-500/20 hover:border-purple-500/60 rounded text-[var(--color-text-secondary)] hover:text-white transition w-full sm:w-auto text-center"
            >
              SIGN IN TO LOG SCORES
            </button>
          </div>
        )}
      </header>

      {/* Games Catalog Section */}
      <section className="w-full mt-6">
        <h2 className="font-display font-extrabold text-2xl mb-8 tracking-wider text-[var(--color-text-primary)] border-b border-purple-500/10 pb-3 flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-[var(--color-neon-pink)]" />
          SELECT YOUR CABINET
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {games.map((game) => (
            <div 
              key={game.id} 
              className="glass-card rounded-lg p-6 relative overflow-hidden flex flex-col justify-between group"
            >
              {/* Retro decorative element */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-radial from-${game.theme === 'cyan' ? 'cyan' : 'fuchsia'}-500/10 to-transparent pointer-events-none group-hover:scale-150 transition-all duration-500`} />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`font-display font-black text-xl tracking-wider ${
                    game.theme === 'cyan' ? 'text-[var(--color-neon-cyan)] glow-cyan' : 'text-[var(--color-neon-pink)] glow-pink'
                  }`}>
                    {game.name}
                  </h3>
                  
                  {currentUser?.stats?.[game.id] && (
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--color-text-muted)] block tracking-widest uppercase">HIGH RECORD</span>
                      <span className="text-sm font-display font-bold text-yellow-400">
                        {game.id === 'memoryMatch' 
                          ? (currentUser.stats[game.id].bestTimeSeconds > 0 ? `${currentUser.stats[game.id].bestTimeSeconds}s` : 'NONE')
                          : (game.id === 'ticTacToe' ? `${currentUser.stats[game.id].wins} Wins` : currentUser.stats[game.id].highScore || 0)
                        }
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                  {game.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-purple-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {game.controls}
                </span>

                <button 
                  onClick={() => onPlayGame(game.id)}
                  className={`retro-btn text-xs !py-2 justify-center ${
                    game.theme === 'cyan' ? 'retro-btn-cyan' : 'retro-btn-pink'
                  }`}
                >
                  INSERT COIN (PLAY)
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Guest notice */}
      {currentUser?.isGuest && (
        <div className="mt-8 p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center max-w-xl">
          ⚠️ <strong>GUEST MODE ACTIVATED</strong>: Your gameplay scores will not be uploaded to the server leaderboards. Sign in to claim your rankings!
        </div>
      )}
    </div>
  );
};

export default LandingPage;
