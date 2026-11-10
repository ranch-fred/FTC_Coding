'use client';
// One small component per step type. Each quiz step is controlled: it shows `answer`, calls `onAnswer`,
// and locks when `result` (the grade) is set. See lib/grade.js for the answer shapes.
import { useMemo, useState } from 'react';
import Simulator from './Simulator';
import Icon from './Icon';
import { useGame } from './Game';
import { runProgram } from '../lib/sim';
import { runInWorker } from '../lib/run-in-worker';
import { randomStart } from '../lib/curriculum';
import { GRID, blankCount, shuffled } from '../lib/grade';
import { saveCode } from '../lib/game';

// Text with `code` spans marked by backticks.
export function Rich({ text }) {
  return text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

export const KINDS = {
  card: ['book', 'Concept'],
  choice: ['target', 'Choose'],
  order: ['list', 'Put in order'],
  blank: ['code', 'Fill the blank'],
  predict: ['route', 'Predict'],
  fix: ['wrench', 'Fix the bug'],
  code: ['code', 'Write code'],
};

// True when the student has given enough to press Check.
export function isReady(step, answer) {
  if (step.type === 'choice') return Number.isInteger(answer);
  if (step.type === 'order') return Array.isArray(answer) && answer.length === step.lines.length;
  if (step.type === 'blank') return Array.isArray(answer) && answer.length === blankCount(step) && answer.every((v) => v?.trim());
  if (step.type === 'predict') return Boolean(answer);
  return false;
}

function Compass() {
  const marks = [[0, 'up', 100, 22], [90, 'right', 178, 104], [180, 'down', 100, 186], [270, 'left', 22, 104]];
  return (
    <svg className="diagram" viewBox="0 0 200 200" role="img" aria-label="Headings: 0 is up, 90 is right, 180 is down, 270 is left. Positive turns go clockwise.">
      <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="2" opacity=".4" />
      <path d="M100 100V52" stroke="#ff8a3d" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="100" r="14" fill="#ff8a3d" />
      <path d="M128 60a48 48 0 0 1 18 26" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M147 76l-1 10-9-4" fill="none" stroke="currentColor" strokeWidth="2" />
      {marks.map(([deg, name, x, y]) => (
        <text key={deg} x={x} y={y} textAnchor="middle" fill="currentColor" fontSize="13" fontFamily="var(--mono)">
          <tspan x={x} fontWeight="700">{deg}</tspan><tspan x={x} dy="14" opacity=".75">{name}</tspan>
        </text>
      ))}
    </svg>
  );
}

function Diagram({ diagram }) {
  // Field diagrams run trusted lesson code (not student code), so the main thread is fine.
  const frames = useMemo(
    () => (diagram.kind === 'field' && diagram.code ? runProgram(diagram.code, diagram.field).frames : undefined),
    [diagram],
  );
  if (diagram.kind === 'compass') return <Compass />;
  if (diagram.kind === 'field') return <Simulator field={diagram.field} frames={frames} />;
  return null;
}

export function Card({ step }) {
  return (
    <>
      {step.body.map((p, i) => <p key={i}><Rich text={p} /></p>)}
      {step.code && <pre><code>{step.code}</code></pre>}
      {step.diagram && <Diagram diagram={step.diagram} />}
    </>
  );
}

export function Choice({ step, answer, onAnswer, result }) {
  return (
    <>
      {step.code && <pre><code>{step.code}</code></pre>}
      <fieldset className="options">
        <legend className="sr">Answers</legend>
        {step.options.map((o, i) => (
          <label key={i} className={`option${result && i === step.answer ? ' right' : ''}`}>
            <input type="radio" name={step.id} checked={answer === i} disabled={Boolean(result)} onChange={() => onAnswer(i)} />
            <span><Rich text={o} /></span>
          </label>
        ))}
      </fieldset>
    </>
  );
}

// Tap lines in the bank to add them to the program; tap a placed line to take it back.
export function Order({ step, answer, onAnswer, result, attempt }) {
  const bank = useMemo(() => shuffled(step.lines.map((text, key) => ({ text, key })), `${step.id}:${attempt}`), [step, attempt]);
  const [picked, setPicked] = useState([]); // keys, in the order chosen
  const set = (keys) => {
    setPicked(keys);
    onAnswer(keys.map((k) => step.lines[k]));
  };
  const locked = Boolean(result);
  return (
    <>
      <p className="label" id={`${step.id}-prog`}>Your program</p>
      <div className="slots" role="group" aria-labelledby={`${step.id}-prog`}>
        {picked.length === 0 && <p className="muted small">Tap the lines below in the right order.</p>}
        {picked.map((k, i) => (
          <button type="button" key={k} className="line-btn" disabled={locked} onClick={() => set(picked.filter((x) => x !== k))}
            aria-label={`Line ${i + 1}: ${step.lines[k].trim()}. Remove.`}>{step.lines[k]}</button>
        ))}
      </div>
      <p className="label" id={`${step.id}-bank`}>Lines</p>
      <div className="bank" role="group" aria-labelledby={`${step.id}-bank`}>
        {bank.filter((l) => !picked.includes(l.key)).map((l) => (
          <button type="button" key={l.key} className="line-btn" disabled={locked} onClick={() => set([...picked, l.key])}>{l.text}</button>
        ))}
      </div>
      <span className="sr" aria-live="polite">{(answer ?? []).length} of {step.lines.length} lines placed</span>
    </>
  );
}

export function Blank({ step, answer, onAnswer, result }) {
  const parts = step.code.split('___');
  const values = answer ?? parts.slice(1).map(() => '');
  return (
    <pre className="blank-code">
      <code>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <input type="text" value={values[i]} disabled={Boolean(result)} aria-label={`Blank ${i + 1}`}
                autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
                onChange={(e) => onAnswer(values.map((v, j) => (j === i ? e.target.value : v)))} />
            )}
          </span>
        ))}
      </code>
    </pre>
  );
}

// Answer on the field: a 5 x 5 grid of buttons laid over the canvas. After checking, the real run plays.
export function Predict({ step, answer, onAnswer, result }) {
  const cells = [];
  for (let row = GRID - 1; row >= 0; row--) for (let col = 0; col < GRID; col++) cells.push({ col, row });
  return (
    <div className="two">
      <pre><code>{step.code}</code></pre>
      <Simulator field={step.field} frames={result?.frames}
        label="Robot field with the robot at its start. Choose the square where it will stop.">
        <div className="grid" role="group" aria-label="Field squares">
          {cells.map(({ col, row }) => (
            <button type="button" key={`${col}-${row}`} disabled={Boolean(result)}
              className={result && result.cell.col === col && result.cell.row === row ? 'right' : ''}
              aria-pressed={answer?.col === col && answer?.row === row}
              aria-label={`Column ${col + 1} from the left, row ${row + 1} from the bottom`}
              onClick={() => onAnswer({ col, row })} />
          ))}
        </div>
      </Simulator>
    </div>
  );
}

// Editor + simulator. Student code runs in a Web Worker with a timeout (lib/run-in-worker.js).
export function CodeStep({ step, onPass, passed }) {
  const { state, apply } = useGame();
  const [code, setCode] = useState(state.code[step.id] ?? step.starter);
  const [run, setRun] = useState(null);
  const [running, setRunning] = useState(false);

  async function go() {
    setRunning(true);
    apply((s) => saveCode(s, step.id, code));
    const r = await runInWorker(code, step.field, randomStart(step.field));
    setRun(r);
    setRunning(false);
    if (r.passed) onPass();
  }

  return (
    <div className="two">
      <div className="stack">
        <label>
          Your code (JavaScript)
          <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" />
        </label>
        <div className="row">
          <button type="button" className="btn" onClick={go} disabled={running}><Icon name="play" />{running ? 'Running…' : 'Run'}</button>
          <button type="button" className="btn quiet" onClick={() => setCode(step.starter)}>Reset code</button>
        </div>
        <div aria-live="polite" className="stack">
          {run?.error && <p className="alert">Error: {run.error}</p>}
          {run && !run.error && !run.passed && <p>Not in the goal zone yet.{run.bumped ? ' The robot bumped into something.' : ''} Change the code and run again.</p>}
          {passed && !run?.passed && run && <p className="muted small">You already passed this step.</p>}
          {run?.logs?.length > 0 && <pre className="logs">{run.logs.join('\n')}</pre>}
        </div>
      </div>
      <Simulator field={step.field} frames={run?.frames} />
    </div>
  );
}
