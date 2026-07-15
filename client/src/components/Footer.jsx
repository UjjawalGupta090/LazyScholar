import React from 'react';
import { Gamepad2, ShieldCheck, Briefcase } from 'lucide-react';

const GithubIcon = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Footer = ({ onNavigate, currentPath, currentUser }) => {
  return (
    <footer className="w-full relative z-10 mt-auto border-t border-purple-500/15 bg-black/40 backdrop-blur-md py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[var(--color-text-secondary)] text-center sm:text-left">
          <div className="flex items-center justify-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[var(--color-neon-cyan)] animate-pulse" />
            <span className="font-display font-bold text-sm tracking-widest text-white">
              LAZY <span className="text-[var(--color-neon-pink)]">SCHOLAR</span>
            </span>
            <span className="text-xs text-[var(--color-text-muted)] font-mono ml-1">v1.0.0</span>
          </div>
          <div className="hidden sm:inline text-[var(--color-text-muted)]">|</div>
          <div className="text-xs">
            Developed by{' '}
            <a 
              href="https://ujjawalguptaportfolio.onrender.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-neon-cyan)] font-semibold hover:underline hover:glow-cyan"
            >
              Ujjawal Gupta
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-display font-semibold tracking-wider text-[var(--color-text-secondary)]">
          <button 
            onClick={() => onNavigate('landing')}
            className={`hover:text-white transition duration-200 cursor-pointer ${currentPath === 'landing' ? 'text-[var(--color-neon-cyan)] glow-cyan' : ''}`}
          >
            ARCADE MAIN
          </button>
          <button 
            onClick={() => onNavigate('leaderboard')}
            className={`hover:text-white transition duration-200 cursor-pointer ${currentPath === 'leaderboard' ? 'text-[var(--color-neon-cyan)] glow-cyan' : ''}`}
          >
            LEADERBOARDS
          </button>
          {currentUser && (
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`hover:text-white transition duration-200 cursor-pointer ${currentPath === 'dashboard' ? 'text-[var(--color-neon-cyan)] glow-cyan' : ''}`}
            >
              PLAYER DECK
            </button>
          )}
        </nav>

        {/* Footer Right: Status Indicators & Socials */}
        <div className="flex items-center gap-4 text-xs font-mono justify-center">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="tracking-wider">SYSTEM ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="https://ujjawalguptaportfolio.onrender.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded bg-purple-950/20 hover:bg-purple-950/40 text-[var(--color-text-secondary)] hover:text-white transition border border-purple-500/15"
              title="Developer Portfolio"
            >
              <Briefcase className="w-4 h-4" />
            </a>
            <a 
              href="https://github.com/UjjawalGupta090/LazyScholar"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded bg-purple-950/20 hover:bg-purple-950/40 text-[var(--color-text-secondary)] hover:text-white transition border border-purple-500/15"
              title="GitHub Repository"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Retro Bottom Slogan */}
      <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-purple-500/5 text-center">
        <p className="text-[10px] font-mono tracking-widest text-[var(--color-text-muted)] uppercase">
          © {new Date().getFullYear()} Lazy Scholar. Simple Games. Serious Nostalgia. INSERT COIN TO PLAY.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
