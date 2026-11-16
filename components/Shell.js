'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthGate from './AuthGate';
import Icon from './Icon';
import { GameProvider, useGame, useNow } from './Game';
import { demo } from '../lib/store';
import { batteryNow, streakOf, MAX_BATTERY } from '../lib/game';

const TABS = [
  ['/', 'Learn', 'route'],
  ['/practice', 'Practice', 'refresh'],
  ['/leaderboard', 'Team', 'trophy'],
  ['/profile', 'Profile', 'user'],
];

export function Battery({ level }) {
  return (
    <span className={`battery${level <= 1 ? ' low' : ''}`} role="img" aria-label={`Battery ${level} of ${MAX_BATTERY}`}>
      {Array.from({ length: MAX_BATTERY }, (_, i) => <i key={i} className={i < level ? 'on' : ''} />)}
    </span>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => setTheme(document.documentElement.dataset.theme || 'dark'), []);
  const flip = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('ftc-theme', next); } catch { /* theme still applies for this visit */ }
    setTheme(next);
  };
  return (
    <button className="icon-btn" onClick={flip} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

function Frame({ children }) {
  const { state, saveError } = useGame();
  const now = useNow();
  const path = usePathname();
  const inLesson = path.startsWith('/lesson') || path.startsWith('/admin/preview');
  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/" className="brand" aria-label="FTC Code Lab home">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="6" y="10" width="20" height="14" rx="3" /><path d="M16 10V5M12 16h.01M20 16h.01M12 20h8M3 15v5M29 15v5" />
            </svg>
            <span>FTC Code Lab</span>
          </Link>
          <div className="row" style={{ gap: 14 }}>
            <span className="stat streak"><Icon name="streak" label="Streak, days" />{streakOf(state, now)}</span>
            <span className="stat"><Icon name="bolt" label="Total XP" />{state.xp}</span>
            <Battery level={batteryNow(state, now).level} />
            <ThemeToggle />
          </div>
        </div>
        {demo && <p className="demo-note">Demo mode: progress is saved in this browser only.</p>}
      </header>
      {!inLesson && (
        <nav className="tabs" aria-label="Main">
          {TABS.map(([href, label, icon]) => (
            <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}><Icon name={icon} />{label}</Link>
          ))}
        </nav>
      )}
      <main>
        {saveError && <p role="alert" className="alert">{saveError}</p>}
        {children}
      </main>
    </>
  );
}

export default function Shell({ children }) {
  return (
    <AuthGate>
      {(user) => (
        <GameProvider user={user}>
          <Frame>{children}</Frame>
        </GameProvider>
      )}
    </AuthGate>
  );
}
