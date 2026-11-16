'use client';
// Runs a list of steps one at a time: answer, check, feedback, continue.
// Wrong quiz answers come back at the end of the session. Used by lessons and by practice.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useGame } from './Game';
import { Card, Choice, Order, Blank, Predict, Match, CodeStep, Rich, KINDS, isReady } from './steps';
import { grade } from '../lib/grade';
import { isQuiz, isCode } from '../lib/curriculum';
import { recordAnswer, drainBattery, batteryNow, HINT_COST } from '../lib/game';

const QUIZ = { choice: Choice, order: Order, blank: Blank, predict: Predict, match: Match };

// mode 'lesson': wrong answers drain the battery. mode 'practice': they do not.
// onDone({ mistakes, hints, firstTry }) runs after the last step. onFlat() runs if the battery hits zero.
export default function Player({ steps, mode, onDone, onFlat }) {
  const { state, apply } = useGame();
  const [queue, setQueue] = useState(steps);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [hintOpen, setHintOpen] = useState(false);
  const tally = useRef({ mistakes: 0, hints: 0, firstTry: 0, seen: new Set(), hinted: new Set() });
  const heading = useRef(null);
  const nextBtn = useRef(null);

  const step = queue[i];
  const quiz = isQuiz(step);
  const [icon, kind] = KINDS[step.type];

  useEffect(() => { heading.current?.focus(); }, [i]);
  useEffect(() => { if (result) nextBtn.current?.focus(); }, [result]);

  function check() {
    const r = grade(step, answer);
    const t = tally.current;
    const first = !t.seen.has(step.id);
    t.seen.add(step.id);
    if (r.correct) { if (first) t.firstTry++; } else { t.mistakes++; setQueue((q) => [...q, step]); }
    apply((s, now) => {
      const next = recordAnswer(s, step.id, r.correct, now, { practice: mode === 'practice' });
      return !r.correct && mode === 'lesson' ? drainBattery(next, now) : next;
    });
    setResult(r);
  }

  function next() {
    if (mode === 'lesson' && result && !result.correct) {
      if (batteryNow(state, new Date()).level === 0) return onFlat();
    }
    if (i + 1 >= queue.length) return onDone(tally.current);
    setI(i + 1);
    setAnswer(null);
    setResult(null);
    setHintOpen(false);
  }

  function showHint() {
    const t = tally.current;
    if (!t.hinted.has(step.id)) { t.hinted.add(step.id); t.hints++; }
    setHintOpen(true);
  }

  function submit(e) {
    e.preventDefault();
    if (result || step.type === 'card') next();
    else if (quiz && isReady(step, answer)) check();
  }

  const Body = QUIZ[step.type];
  const canContinue = Boolean(result) || step.type === 'card';
  return (
    <form className="player" onSubmit={submit}>
      <div className="player-top">
        <Link href="/" className="icon-btn" aria-label="Leave and go back to the path"><Icon name="x" /></Link>
        <div className="meter info" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={i}>
          <i style={{ width: `${(i / queue.length) * 100}%` }} />
        </div>
        <span className="mono small muted">{i + 1}/{queue.length}</span>
      </div>

      <section className="step" key={`${step.id}:${i}`}>
        <p className="label kind"><Icon name={icon} />{kind}</p>
        <h1 ref={heading} tabIndex={-1}><Rich text={step.title ?? step.prompt} /></h1>
        {step.type === 'card' && <Card step={step} />}
        {Body && <Body step={step} answer={answer} onAnswer={setAnswer} result={result} attempt={i} />}
        {isCode(step) && step.code && <pre><code>{step.code}</code></pre>}
        {isCode(step) && <CodeStep step={step} passed={Boolean(result)} onPass={() => setResult({ correct: true })} />}
      </section>

      {hintOpen && <p className="card hint" role="status"><strong>Hint: </strong><Rich text={step.hint} /></p>}

      <div aria-live="polite">
        {result && quiz && (
          <div className={`feedback ${result.correct ? 'good' : 'bad'}`}>
            <h2><Icon name={result.correct ? 'check' : 'x'} />{result.correct ? 'Correct' : 'Not quite'}</h2>
            {!result.correct && <div><span className="label">Answer</span><pre><code>{result.expected}</code></pre></div>}
            {step.explain && <p><Rich text={step.explain} /></p>}
            {!result.correct && <p className="small muted">This one comes back at the end.{mode === 'lesson' ? ' Battery −1.' : ''}</p>}
          </div>
        )}
        {result && !quiz && (
          <div className="feedback good"><h2><Icon name="check" />Solved</h2></div>
        )}
      </div>

      <div className="actions">
        {step.hint && !result && !hintOpen && mode === 'lesson'
          ? <button type="button" className="btn ghost" onClick={showHint}><Icon name="bulb" />Hint (−{HINT_COST} XP)</button>
          : <span />}
        {canContinue
          ? <button type="submit" className="btn" ref={nextBtn}>Continue<Icon name="arrow" /></button>
          : quiz && <button type="submit" className="btn" disabled={!isReady(step, answer)}>Check</button>}
      </div>
    </form>
  );
}
