'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AuthGate from '../../../components/AuthGate';
import Simulator from '../../../components/Simulator';
import { getLesson, randomStart } from '../../../lib/lessons';
import { runInWorker } from '../../../lib/run-in-worker';
import { supabase } from '../../../lib/supabase';

function Lesson({ lesson, user }) {
  const [code, setCode] = useState(lesson.starter);
  const [loaded, setLoaded] = useState(false);
  const [wasDone, setWasDone] = useState(false);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  useEffect(() => {
    supabase.from('progress').select('code,completed').eq('lesson_id', lesson.id).maybeSingle().then(({ data }) => {
      if (data) { setCode(data.code || lesson.starter); setWasDone(data.completed); }
      setLoaded(true);
    });
  }, [lesson]);

  async function run() {
    setRunning(true);
    const r = await runInWorker(code, lesson, randomStart(lesson));
    setResult(r);
    setRunning(false);
    const completed = wasDone || r.passed;
    const { error } = await supabase
      .from('progress')
      .upsert({ user_id: user.id, lesson_id: lesson.id, code, completed, updated_at: new Date().toISOString() });
    setSaveErr(error ? `Could not save progress: ${error.message}` : '');
    if (!error) setWasDone(completed);
  }

  return (
    <>
      <h1>{lesson.title}</h1>
      <p>{lesson.text}</p>
      <div className="lesson">
        <div>
          <label>
            Your code (JavaScript)
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} disabled={!loaded} />
          </label>
          <p>
            <button onClick={run} disabled={running || !loaded}>{running ? 'Running…' : '▶ Run'}</button>{' '}
            <button className="link" onClick={() => setCode(lesson.starter)}>Reset code</button>
          </p>
          <div aria-live="polite">
            {result?.error && <p className="err">Error: {result.error}</p>}
            {result && !result.error && (result.passed
              ? <p className="ok">Goal reached! 🎉</p>
              : <p>Not there yet.{result.bumped ? ' You bumped into something.' : ''}</p>)}
            {wasDone && !result?.passed && <p className="ok">Already completed ✓</p>}
            {saveErr && <p className="err">{saveErr}</p>}
            {result?.logs?.length > 0 && <pre>{result.logs.join('\n')}</pre>}
          </div>
        </div>
        <Simulator lesson={lesson} frames={result?.frames ?? []} />
      </div>
      <p><a href="/">← All lessons</a></p>
    </>
  );
}

export default function Page() {
  const { id } = useParams();
  const lesson = getLesson(id);
  if (!lesson) return <p>Lesson not found. <a href="/">Back</a></p>;
  return <AuthGate>{(user) => <Lesson key={lesson.id} lesson={lesson} user={user} />}</AuthGate>;
}
