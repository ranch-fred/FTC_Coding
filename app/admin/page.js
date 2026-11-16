'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '../../components/Icon';
import { Rich } from '../../components/steps';
import { units, lessons, quizSteps, getLesson } from '../../lib/curriculum';
import { store, demo } from '../../lib/store';
import { teamSummary, hardestQuestions } from '../../lib/admin';

const MARK = { gold: ['star', 'Gold'], done: ['check', 'Done'], started: ['play', 'Started'], none: [null, 'Not started'] };

function idle(t) {
  if (t.idleDays === null) return 'never';
  if (t.idleDays === 0) return 'today';
  return t.idleDays === 1 ? 'yesterday' : `${t.idleDays} days ago`;
}

function Teammate({ t }) {
  return (
    <details className="card mate">
      <summary>
        <strong>{t.email}</strong>{t.name ? ` (${t.name})` : ''}
        <span className="muted small"> · {t.done}/{t.total} lessons · last active {idle(t)}</span>
      </summary>
      <div className="stack">
        <p className="small">Level {t.level} · {t.xp} XP · {t.weekXp} XP this week · streak {t.streak} (best {t.bestStreak}) · {t.gold} gold · {t.openMistakes} open mistakes</p>
        {t.units.map((u, n) => (
          <div key={u.id}>
            <p className="small"><strong>{n + 1}. {u.title}</strong> <span className="muted">{u.done}/{u.total}</span></p>
            <ul className="marks">
              {u.lessons.map((l) => {
                const [icon, word] = MARK[l.status];
                return <li key={l.id} className={l.status}>{icon && <Icon name={icon} />}<span>{l.title}</span><span className="sr">: {word}</span></li>;
              })}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function Admin() {
  const [data, setData] = useState(null);

  useEffect(() => {
    store.adminData().then(setData);
  }, []);

  if (!data) return <p>Loading…</p>;
  if (!data.isAdmin) return <p role="alert">Mentors only. Your email is not in the admins table.</p>;
  const team = teamSummary(data.rows, units, new Date());
  const hard = hardestQuestions(data.rows, quizSteps);
  return (
    <div className="stack">
      <h1>Mentor view</h1>
      {demo && <p className="muted">Sample data. The teammates are made up; the you@demo.local row is this browser.</p>}

      <section className="stack" aria-labelledby="h-team">
        <h2 id="h-team">Team</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Teammate</th><th>Last active</th><th>Streak</th><th>Level</th><th>XP</th><th>This week</th><th>Lessons</th><th>Gold</th></tr>
            </thead>
            <tbody>
              {team.map((t) => (
                <tr key={t.email}>
                  <td>{t.email}</td>
                  <td className={t.idleDays === null || t.idleDays > 7 ? 'warn' : ''}>{idle(t)}</td>
                  <td>{t.streak}</td>
                  <td>{t.level}</td>
                  <td>{t.xp}</td>
                  <td>{t.weekXp}</td>
                  <td>{t.done}/{t.total}</td>
                  <td>{t.gold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {team.length === 0 && <p className="muted">Nobody has signed in yet.</p>}
      </section>

      <section className="stack" aria-labelledby="h-units">
        <h2 id="h-units">Progress by unit</h2>
        <p className="muted small">Lessons finished in each unit. Column numbers are unit numbers.</p>
        <div className="scroll">
          <table className="matrix">
            <thead>
              <tr><th>Teammate</th>{units.map((u, n) => <th key={u.id} title={u.title}><abbr title={u.title}>{n + 1}</abbr></th>)}</tr>
            </thead>
            <tbody>
              {team.map((t) => (
                <tr key={t.email}>
                  <td>{t.email}</td>
                  {t.units.map((u) => <td key={u.id} className={u.done === u.total ? 'full' : u.done ? 'part' : ''}>{u.done}/{u.total}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack" aria-labelledby="h-lessons">
        <h2 id="h-lessons">Progress by lesson</h2>
        <p className="muted small">Open a teammate to see every lesson.</p>
        {team.map((t) => <Teammate key={t.email} t={t} />)}
      </section>

      <section className="stack" aria-labelledby="h-hard">
        <h2 id="h-hard">Hardest questions</h2>
        <p className="muted small">Quiz questions with the most wrong answers across the team. Good topics for the next meeting.</p>
        {hard.length === 0 ? <p className="muted">No wrong answers recorded yet.</p> : (
          <div className="scroll">
            <table className="wrap">
              <thead><tr><th>Question</th><th>Lesson</th><th>Wrong</th><th>Missed by</th><th>Wrong rate</th></tr></thead>
              <tbody>
                {hard.map((h) => (
                  <tr key={h.id}>
                    <td><Rich text={h.prompt} /></td>
                    <td><Link href={`/admin/preview/${h.lessonId}`}>{getLesson(h.lessonId).title}</Link></td>
                    <td>{h.wrong}</td>
                    <td>{h.missedBy} of {h.tried}</td>
                    <td>{Math.round(h.rate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="stack" aria-labelledby="h-course">
        <h2 id="h-course">Course content</h2>
        <p className="small">
          {units.length} units, {lessons.length} lessons. Lessons are data files in <code>lib/curriculum/</code>. To add or change one, edit the unit&apos;s file,
          run <code>npm test</code>, and deploy. The README section &quot;Add a lesson&quot; has the format. Preview opens a lesson without locks and without saving answers.
        </p>
        {units.map((u, n) => (
          <details key={u.id} className="card mate">
            <summary><strong>{n + 1}. {u.title}</strong> <span className="muted small">· {u.lessons.length} lessons · <code>{u.file}</code></span></summary>
            <ul className="plain">
              {u.lessons.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/preview/${l.id}`}>{l.title}</Link>
                  <span className="muted small"> · <code>{l.id}</code> · {l.steps.length} steps · {l.xp} XP</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>

      <p><Link href="/">Back to the path</Link></p>
    </div>
  );
}
