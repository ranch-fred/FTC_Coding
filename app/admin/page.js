'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { lessons } from '../../lib/curriculum';
import { store, demo } from '../../lib/store';
import { levelOf, streakOf, lastActive } from '../../lib/game';

export default function Admin() {
  const [data, setData] = useState(null);

  useEffect(() => {
    store.adminData().then(setData);
  }, []);

  if (!data) return <p>Loading…</p>;
  if (!data.isAdmin) return <p role="alert">Mentors only. Your email is not in the admins table.</p>;
  const now = new Date();
  return (
    <div className="stack">
      <h1>Team progress</h1>
      {demo && <p className="muted">Sample data. The teammates are made up; the you@demo.local row is this browser.</p>}
      <div className="scroll">
        <table>
          <thead>
            <tr><th>Teammate</th><th>Level</th><th>XP</th><th>Streak</th><th>Lessons</th><th>Gold</th><th>Last active</th></tr>
          </thead>
          <tbody>
            {data.rows.map(({ email, state }) => (
              <tr key={email}>
                <td>{email}</td>
                <td>{levelOf(state.xp).level}</td>
                <td>{state.xp}</td>
                <td>{streakOf(state, now)}</td>
                <td>{lessons.filter((l) => state.lessons[l.id]?.done).length}/{lessons.length}</td>
                <td>{lessons.filter((l) => state.lessons[l.id]?.mastered).length}</td>
                <td>{lastActive(state) ?? 'never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p><Link href="/">Back to the path</Link></p>
    </div>
  );
}
