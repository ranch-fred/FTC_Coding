'use client';
import Link from 'next/link';
import Icon from '../components/Icon';
import { useGame, useNow } from '../components/Game';
import { Rich } from '../components/steps';
import { units, lessons, lessonOrder, quizSteps } from '../lib/curriculum';
import { lessonStatus, xpToday, practiceSet, batteryNow, levelOf } from '../lib/game';

// The path looks like a circuit trace: straight runs joined by 45-degree bends.
const ROW = 112; // px between lessons
const MID = 140; // centre of the 280px track
const SWAY = [0, 52, 78, 52, 0, -52, -78, -52];
const STATUS = {
  locked: ['lock', 'Locked'],
  available: ['play', 'Start'],
  started: ['play', 'In progress'],
  done: ['check', 'Completed'],
  mastered: ['star', 'Gold'],
};

function Unit({ unit, number, firstIndex, state }) {
  const pts = unit.lessons.map((l, i) => ({
    lesson: l,
    x: MID + SWAY[(firstIndex + i) % SWAY.length],
    y: i * ROW + 40,
    status: lessonStatus(state, lessonOrder, l.id),
  }));
  const done = pts.filter((p) => p.status === 'done' || p.status === 'mastered').length;
  return (
    <section className="unit" aria-labelledby={`unit-${unit.id}`}>
      <div className="card unit-head">
        <p className="label">Unit {number} · {done}/{pts.length} lessons</p>
        <h2 id={`unit-${unit.id}`}>{unit.title}</h2>
        <p className="muted"><Rich text={unit.blurb} /></p>
        {unit.matchDay && <details><summary>Why this matters on match day</summary><p className="small"><Rich text={unit.matchDay} /></p></details>}
      </div>
      <div className="trace" style={{ height: pts.length * ROW }}>
        <svg viewBox={`0 0 280 ${pts.length * ROW}`} aria-hidden="true">
          {pts.slice(1).map((b, i) => {
            const a = pts[i];
            const straight = (ROW - Math.abs(b.x - a.x)) / 2;
            const live = a.status === 'done' || a.status === 'mastered';
            return <path key={b.lesson.id} className={live ? 'live' : ''} d={`M${a.x} ${a.y}V${a.y + straight}L${b.x} ${b.y - straight}V${b.y}`} />;
          })}
        </svg>
        {pts.map(({ lesson, x, y, status }) => {
          const [icon, word] = STATUS[status];
          const cls = `node ${status}${lesson.boss ? ' boss' : ''}`;
          const style = { left: x, top: y - (lesson.boss ? 36 : 32) };
          const inner = (
            <>
              <span className="pad"><Icon name={status === 'locked' ? 'lock' : lesson.boss && status !== 'mastered' && status !== 'done' ? 'flag' : icon} /></span>
              <span className="name">{lesson.title}</span>
            </>
          );
          return status === 'locked'
            ? <span key={lesson.id} className={cls} style={style} aria-label={`${lesson.title}. Locked: finish the lesson before it.`}>{inner}</span>
            : <Link key={lesson.id} href={`/lesson/${lesson.id}`} className={cls} style={style} aria-label={`${lesson.title}. ${word}. ${lesson.xp} XP.`}>{inner}</Link>;
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const { state } = useGame();
  const now = useNow();
  const today = xpToday(state, now);
  const next = lessons.find((l) => !state.lessons[l.id]?.done);
  const { due } = practiceSet(state, quizSteps.map((q) => q.id), now);
  const battery = batteryNow(state, now);
  const lvl = levelOf(state.xp);
  let index = 0;
  return (
    <>
      <h1 className="sr">Learning path</h1>
      <section className="card today" aria-label="Today">
        <div className="row spread">
          <p className="label">Daily goal</p>
          <p className="mono small">{Math.min(today, state.goal)}/{state.goal} XP{today >= state.goal ? ' · done' : ''}</p>
        </div>
        <div className="meter" role="progressbar" aria-label="Daily goal" aria-valuemin={0} aria-valuemax={state.goal} aria-valuenow={Math.min(today, state.goal)}>
          <i style={{ width: `${Math.min(100, (today / state.goal) * 100)}%` }} />
        </div>
        <p className="small muted">Level {lvl.level} · {lvl.span - lvl.into} XP to level {lvl.level + 1}</p>
        {battery.level === 0 && <p className="small">Battery flat. A practice session recharges it, or wait {Math.ceil(battery.nextMs / 60000)} min for one cell.</p>}
        <div className="row">
          {next
            ? <Link href={`/lesson/${next.id}`} className="btn"><Icon name="play" />{state.lessons[next.id] ? 'Continue' : 'Start'}: {next.title}</Link>
            : <p>Course complete. Keep your streak with practice.</p>}
          <Link href="/practice" className="btn ghost"><Icon name="refresh" />Practice{due > 0 ? ` (${due} due)` : ''}</Link>
        </div>
      </section>
      {units.map((u, n) => {
        const first = index;
        index += u.lessons.length;
        return <Unit key={u.id} unit={u} number={n + 1} firstIndex={first} state={state} />;
      })}
      <p style={{ marginTop: 32 }}><Link href="/admin"><Icon name="shield" /> Mentor view</Link></p>
    </>
  );
}
