'use client';
import { useEffect, useState } from 'react';
import AuthGate from '../components/AuthGate';
import { lessons } from '../lib/lessons';
import { supabase } from '../lib/supabase';

function Home() {
  const [done, setDone] = useState(new Set());
  useEffect(() => {
    supabase.from('progress').select('lesson_id').eq('completed', true).then(({ data }) =>
      setDone(new Set((data ?? []).map((r) => r.lesson_id))),
    );
  }, []);
  return (
    <>
      <h1>Lessons</h1>
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
  return <AuthGate>{() => <Home />}</AuthGate>;
}
