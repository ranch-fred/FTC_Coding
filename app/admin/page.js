'use client';
import { useEffect, useState } from 'react';
import AuthGate from '../../components/AuthGate';
import { lessons } from '../../lib/lessons';
import { store, demo } from '../../lib/store';

function Admin() {
  const [data, setData] = useState(null);

  useEffect(() => {
    store.adminData().then(setData);
  }, []);

  if (!data) return <p>Loading…</p>;
  const { isAdmin, rows } = data;
  if (!isAdmin) return <p role="alert">Mentors only. Your email is not in the admins table.</p>;

  const byUser = new Map();
  for (const r of rows) {
    const u = byUser.get(r.email) ?? { done: new Set(), last: '' };
    if (r.completed) u.done.add(r.lesson_id);
    if (r.updated_at > u.last) u.last = r.updated_at;
    byUser.set(r.email, u);
  }
  return (
    <>
      <h1>Team progress</h1>
      {demo && <p>Sample data. Teammates below are made up; the {'"you"'} row is this browser.</p>}
      <table>
        <thead>
          <tr><th>Teammate</th>{lessons.map((l) => <th key={l.id}>{l.title}</th>)}<th>Last active</th></tr>
        </thead>
        <tbody>
          {[...byUser].map(([email, u]) => (
            <tr key={email}>
              <td>{email}</td>
              {lessons.map((l) => <td key={l.id}>{u.done.has(l.id) ? '✓' : '–'}</td>)}
              <td>{new Date(u.last).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><a href="/">← Lessons</a></p>
    </>
  );
}

export default function Page() {
  return <AuthGate>{() => <Admin />}</AuthGate>;
}
