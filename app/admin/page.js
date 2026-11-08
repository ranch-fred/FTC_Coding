'use client';
import { useEffect, useState } from 'react';
import AuthGate from '../../components/AuthGate';
import { lessons } from '../../lib/lessons';
import { supabase } from '../../lib/supabase';

function Admin() {
  const [rows, setRows] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    supabase.from('admins').select('email').maybeSingle().then(({ data }) => setIsAdmin(Boolean(data)));
    supabase.from('progress').select('email,lesson_id,completed,updated_at').then(({ data }) => setRows(data ?? []));
  }, []);

  if (isAdmin === null || rows === null) return <p>Loading…</p>;
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
