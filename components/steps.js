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
import { API } from '../lib/api';

// Text with `code` in backticks and **bold** in double stars.
const bold = (text) => text.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
export function Rich({ text }) {
  return text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : <span key={i}>{bold(part)}</span>));
}

export const KINDS = {
  card: ['book', 'Concept'],
  choice: ['target', 'Choose'],
  order: ['list', 'Put in order'],
  blank: ['code', 'Fill the blank'],
  predict: ['route', 'Predict'],
  match: ['list', 'Match'],
  fix: ['wrench', 'Fix the bug'],
  code: ['code', 'Write code'],
};

// True when the student has given enough to press Check.
export function isReady(step, answer) {
  if (step.type === 'choice') return Number.isInteger(answer);
  if (step.type === 'order') return Array.isArray(answer) && answer.length === step.lines.length;
  if (step.type === 'blank') return Array.isArray(answer) && answer.length === blankCount(step) && answer.every((v) => v?.trim());
  if (step.type === 'predict') return Boolean(answer);
  if (step.type === 'match') return Array.isArray(answer) && answer.length === step.pairs.length && answer.every(Boolean);
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

const box = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, rx: 8 };
const txt = { fill: 'currentColor', fontSize: 12, fontFamily: 'var(--mono)', textAnchor: 'middle' };

// Sense, think, act: the loop every robot runs.
function Cycle() {
  const nodes = [['Sense', 'sensors', 100, 34], ['Think', 'program', 176, 150], ['Act', 'motors', 24, 150]];
  return (
    <svg className="diagram" viewBox="0 0 200 200" role="img" aria-label="A loop: sense with sensors, think with the program, act with motors, then sense again.">
      <path d="M128 52 162 122M146 166H56M40 122 74 52" fill="none" stroke="#ff8a3d" strokeWidth="3" strokeLinecap="round" />
      <path d="M162 122l-9-4M162 122l2-10M56 166l8-6M56 166l8 6M74 52l-9 5M74 52l1 10" fill="none" stroke="#ff8a3d" strokeWidth="3" strokeLinecap="round" />
      {nodes.map(([name, sub, x, y]) => (
        <g key={name}>
          <rect x={x - 34} y={y - 22} width="68" height="44" {...box} />
          <text x={x} y={y - 2} {...txt} fontWeight="700">{name}</text>
          <text x={x} y={y + 13} {...txt} opacity=".75" fontSize="10">{sub}</text>
        </g>
      ))}
    </svg>
  );
}

// The parts of the FTC control system and how they connect.
function System() {
  const parts = [['Sensors', 50], ['Motors', 120], ['Servos', 190]];
  return (
    <svg className="diagram" viewBox="0 0 240 200" role="img" aria-label="Gamepads connect to the Driver Station. The Driver Station talks to the Control Hub over Wi-Fi. The Control Hub connects to sensors, motors and servos, and is powered by the battery.">
      <rect x="10" y="10" width="90" height="34" {...box} /><text x="55" y="31" {...txt}>Gamepads</text>
      <rect x="140" y="10" width="90" height="34" {...box} /><text x="185" y="31" {...txt}>Driver Station</text>
      <rect x="70" y="84" width="100" height="40" {...box} stroke="#ff8a3d" strokeWidth="3" /><text x="120" y="108" {...txt} fontWeight="700">Control Hub</text>
      <rect x="185" y="88" width="48" height="32" {...box} /><text x="209" y="108" {...txt} fontSize="10">Battery</text>
      <path d="M100 27h40M185 44 140 84M170 104h15M120 124v16M50 140h140M50 140v14M120 140v14M190 140v14" fill="none" stroke="currentColor" strokeWidth="2" opacity=".6" />
      <text x="176" y="68" {...txt} fontSize="10" opacity=".75">Wi-Fi</text>
      {parts.map(([name, x]) => (
        <g key={name}><rect x={x - 32} y="154" width="64" height="32" {...box} /><text x={x} y="174" {...txt}>{name}</text></g>
      ))}
    </svg>
  );
}

// The three parts of a match, to scale.
function Timeline() {
  return (
    <svg className="diagram" viewBox="0 0 300 110" style={{ maxWidth: 420 }} role="img" aria-label="Match timeline: Autonomous for 30 seconds, then TeleOp for 2 minutes. The last 30 seconds of TeleOp are Endgame.">
      <rect x="10" y="36" width="56" height="34" fill="#4cc9f0" rx="4" />
      <rect x="70" y="36" width="164" height="34" fill="#ff8a3d" rx="4" />
      <rect x="234" y="36" width="56" height="34" fill="#fbbf24" rx="4" />
      <text x="38" y="58" {...txt} fill="#0b111c" fontWeight="700">Auto</text>
      <text x="152" y="58" {...txt} fill="#0b111c" fontWeight="700">TeleOp</text>
      <text x="262" y="58" {...txt} fill="#0b111c" fontWeight="700" fontSize="10">Endgame</text>
      <text x="38" y="26" {...txt}>30 s</text>
      <text x="180" y="26" {...txt}>2 min, drivers in control</text>
      <text x="262" y="88" {...txt} fontSize="10">last 30 s</text>
      <text x="38" y="88" {...txt} fontSize="10">code only</text>
    </svg>
  );
}

const DIAGRAMS = { compass: Compass, cycle: Cycle, system: System, timeline: Timeline };

function Diagram({ diagram }) {
  // Field diagrams run trusted lesson code (not student code), so the main thread is fine.
  const frames = useMemo(
    () => (diagram.kind === 'field' && diagram.code ? runProgram(diagram.code, diagram.field).frames : undefined),
    [diagram],
  );
  const Named = DIAGRAMS[diagram.kind];
  if (Named) return <Named />;
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

// Match each item on the left with its meaning on the right, using a menu per row.
export function Match({ step, answer, onAnswer, result, attempt }) {
  const rights = useMemo(() => shuffled([...new Set(step.pairs.map(([, r]) => r))].sort(), `${step.id}:${attempt}`), [step, attempt]);
  const values = answer ?? step.pairs.map(() => '');
  return (
    <div className="match">
      {step.pairs.map(([left], i) => (
        <label key={i} className="match-row">
          <span className="mono"><Rich text={left} /></span>
          <select value={values[i]} disabled={Boolean(result)} onChange={(e) => onAnswer(values.map((v, j) => (j === i ? e.target.value : v)))}>
            <option value="">Choose…</option>
            {rights.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

const describe = (seg) => {
  const keys = Object.keys(seg).filter((k) => k !== 'for');
  return keys.length ? keys.map((k) => `${k} = ${seg[k]}`).join(', ') : 'nothing pressed';
};
// What the (simulated) driver does with the gamepad during a TeleOp challenge.
function Script({ script }) {
  let t = 0;
  return (
    <div>
      <p className="label">What the driver does</p>
      <ol className="script">
        {script.map((seg, i) => {
          const from = t;
          t = Math.round((t + seg.for) * 100) / 100;
          return <li key={i}><span className="mono">{from}–{t} s</span> {describe(seg)}</li>;
        })}
      </ol>
    </div>
  );
}

// Editor + simulator. Student code runs in a Web Worker with a timeout (lib/run-in-worker.js).
// Challenges without a robot start (pure JavaScript practice) show only the output.
export function CodeStep({ step, onPass, passed }) {
  const { state, apply } = useGame();
  const [code, setCode] = useState(state.code[step.id] ?? step.starter);
  const [run, setRun] = useState(null);
  const [running, setRunning] = useState(false);
  const f = step.field;
  const hasField = Boolean(f.start);

  async function go() {
    setRunning(true);
    apply((s) => saveCode(s, step.id, code));
    const r = await runInWorker(code, f, randomStart(f));
    setRun(r);
    setRunning(false);
    if (r.passed) onPass();
  }

  return (
    <div className={hasField ? 'two' : 'stack'}>
      <div className="stack">
        {f.script && <Script script={f.script} />}
        {f.expectLogs && <div><p className="label">Expected output</p><pre>{f.expectLogs.join('\n')}</pre></div>}
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
          {run && !run.error && (
            <ul className="checks">
              {run.checks.map((c) => (
                <li key={c.label} className={c.ok ? 'ok' : 'no'}><Icon name={c.ok ? 'check' : 'x'} label={c.ok ? 'Met:' : 'Not met:'} /> {c.label}</li>
              ))}
            </ul>
          )}
          {run && !run.error && !run.passed && <p>Not solved yet.{run.bumped ? ' The robot bumped into something.' : ''} Change the code and run again.</p>}
          {passed && run && !run.passed && <p className="muted small">You already passed this step.</p>}
          {run?.logs?.length > 0 && <div><p className="label">Output</p><pre className="logs">{run.logs.join('\n')}</pre></div>}
        </div>
        <details className="api">
          <summary>Robot commands</summary>
          {API.map(([group, items]) => (
            <div key={group}>
              <p className="label">{group}</p>
              <dl>{items.map(([sig, what]) => <div key={sig}><dt><code>{sig}</code></dt><dd>{what}</dd></div>)}</dl>
            </div>
          ))}
        </details>
      </div>
      {hasField && <Simulator field={f} frames={run?.frames} tag={run?.tag} />}
    </div>
  );
}
