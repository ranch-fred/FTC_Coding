'use client';
import { useState } from 'react';
import Icon from '../../components/Icon';
import { useGame, useNow } from '../../components/Game';
import { units, lessons } from '../../lib/curriculum';
import { supabase } from '../../lib/supabase';
import { store, demo } from '../../lib/store';
import { levelOf, streakOf, longestStreak, weeklyXp, badges, unitsDone, GOALS } from '../../lib/game';

export default function Profile() {
  const { user, state, apply } = useGame();
  const now = useNow();
  const [name, setName] = useState(state.name);
  const [saved, setSaved] = useState('');
  const lvl = levelOf(state.xp);
  const list = badges(state, units);
  const finished = unitsDone(state, units);
  const doneCount = lessons.filter((l) => state.lessons[l.id]?.done).length;

  function saveName(e) {
    e.preventDefault();
    const clean = name.trim().slice(0, 24);
    apply((s) => ({ ...s, name: clean }));
    setName(clean);
    setSaved(clean ? `You are on the team leaderboard as "${clean}".` : 'You are not on the leaderboard.');
  }

  return (
    <div className="stack">
      <h1>Profile</h1>
      <p className="muted">{user.email}</p>

      <section className="card stack" aria-label="Level">
        <div className="row spread"><h2>Level {lvl.level}</h2><span className="mono small">{lvl.into}/{lvl.span} XP</span></div>
        <div className="meter gold" role="progressbar" aria-label={`Progress to level ${lvl.level + 1}`} aria-valuemin={0} aria-valuemax={lvl.span} aria-valuenow={lvl.into}>
          <i style={{ width: `${(lvl.into / lvl.span) * 100}%` }} />
        </div>
      </section>

      <div className="tiles">
        <div className="tile"><strong>{state.xp}</strong><span className="label">Total XP</span></div>
        <div className="tile"><strong>{weeklyXp(state, now)}</strong><span className="label">XP this week</span></div>
        <div className="tile"><strong>{streakOf(state, now)}</strong><span className="label">Day streak</span></div>
        <div className="tile"><strong>{longestStreak(state)}</strong><span className="label">Best streak</span></div>
        <div className="tile"><strong>{doneCount}/{lessons.length}</strong><span className="label">Lessons</span></div>
        <div className="tile"><strong>{finished.length}/{units.length}</strong><span className="label">Units</span></div>
      </div>

      <section className="stack">
        <h2>Badges</h2>
        <ul className="badges">
          {list.map((b) => (
            <li key={b.id} className={`badge${b.earned ? '' : ' off'}`}>
              <Icon name={b.earned ? b.icon : 'lock'} />
              <strong>{b.name}</strong>
              <span>{b.desc}</span>
              <span className="label">{b.earned ? 'Earned' : 'Locked'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack">
        <h2>Completed units</h2>
        {finished.length === 0
          ? <p className="muted">None yet. Finish every lesson in a unit to complete it.</p>
          : <ul>{finished.map((u) => <li key={u.id}>{u.title}</li>)}</ul>}
      </section>

      <section className="card stack">
        <h2>Settings</h2>
        <fieldset className="choices">
          <legend>Daily goal</legend>
          {GOALS.map((g) => (
            <label key={g} className="chip">
              <input type="radio" name="goal" checked={state.goal === g} onChange={() => apply((s) => ({ ...s, goal: g }))} />
              {g} XP
            </label>
          ))}
        </fieldset>
        <form onSubmit={saveName} className="stack">
          <label>
            Leaderboard name
            <input type="text" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
          </label>
          <p className="small muted">Optional. Teammates see this name and your weekly XP. Leave it empty to stay off the leaderboard. Do not use your full name.</p>
          <div className="row"><button className="btn ghost" type="submit">Save name</button><span role="status" className="small">{saved}</span></div>
        </form>
        {demo
          ? <button className="btn ghost" onClick={async () => { if (window.confirm('Erase all demo progress in this browser?')) { await store.reset(); window.location.href = '/'; } }}>Reset demo progress</button>
          : <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>}
      </section>
    </div>
  );
}
