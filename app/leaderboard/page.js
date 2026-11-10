'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGame } from '../../components/Game';
import { store } from '../../lib/store';

export default function Leaderboard() {
  const { user, state } = useGame();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    store.leaderboard(user).then(setRows);
  }, [user, state.name]);

  return (
    <div className="stack">
      <h1>Team leaderboard</h1>
      <p className="muted">XP earned in the last 7 days.</p>
      {!state.name && <p className="card">You are not listed. <Link href="/profile">Choose a leaderboard name</Link> to join. It is optional.</p>}
      {rows === null && <p>Loading…</p>}
      {rows?.length === 0 && <p className="muted">Nobody has joined yet.</p>}
      {rows?.length > 0 && (
        <ol className="board">
          {rows.map((r, i) => (
            <li key={i} className={r.you ? 'you' : ''}>
              <span>{r.name}{r.you ? ' (you)' : ''}</span>
              <strong className="mono">{r.xp} XP</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
