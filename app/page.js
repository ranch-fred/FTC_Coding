'use client';
import { useEffect, useState } from 'react';
import AuthGate from '../components/AuthGate';
import { lessons } from '../lib/lessons';
import { store } from '../lib/store';

function Home({ user }) {
  const [{ done, xp, streak }, setSummary] = useState({ done: new Set(), xp: 0, streak: 0 });
  useEffect(() => {
    store.summary(user).then(setSummary);
  }, [user]);
  return (
    <>
      <h1>Lessons</h1>
      <p className="stats">{xp} XP · {streak}-day streak · {done.size}/{lessons.length} lessons</p>
      <ul className="lessons">
        {lessons.map((l) => (
          <li key={l.id}>
            <a href={`/lesson/${l.id}`} className={done.has(l.id) ? 'done' : ''}>{l.title}</a>
          </li>
        ))}
      </ul>
      <p><a href="/admin">Mentor view</a></p>
    </>
  );
}

export default function Page() {
  return <AuthGate>{(user) => <Home user={user} />}</AuthGate>;
}
