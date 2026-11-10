'use client';
import { useState } from 'react';
import Link from 'next/link';
import Player from '../../components/Player';
import Celebrate from '../../components/Celebrate';
import Icon from '../../components/Icon';
import { useGame, useNow } from '../../components/Game';
import { quizSteps, getStep } from '../../lib/curriculum';
import { practiceSet, mistakeSet, finishPractice, PRACTICE_RECHARGE } from '../../lib/game';

const IDS = quizSteps.map((q) => q.id);

export default function Practice() {
  const { state, apply } = useGame();
  const now = useNow();
  const [steps, setSteps] = useState(null);
  const [summary, setSummary] = useState(null);

  if (summary) {
    return (
      <Celebrate
        title="Practice complete"
        gold={summary.mistakes === 0}
        tiles={[['XP earned', `+${summary.earned}`], ['First try', `${summary.firstTry}/${summary.total}`], ['Battery', `+${PRACTICE_RECHARGE}`]]}
        banners={summary.leveledUp ? [['bolt', `Level up! You are now level ${summary.level}.`]] : []}
      />
    );
  }
  if (steps) {
    return (
      <Player
        steps={steps}
        mode="practice"
        onDone={({ mistakes, firstTry }) => {
          const out = apply((s, t) => finishPractice(s, firstTry, t));
          setSummary({ ...out, mistakes, firstTry, total: steps.length });
        }}
      />
    );
  }

  const daily = practiceSet(state, IDS, now);
  const missed = mistakeSet(state, IDS);
  const start = (ids) => setSteps(ids.map(getStep));
  return (
    <div className="stack">
      <h1>Practice</h1>
      <p className="muted">Short review sessions. They never drain the battery, and finishing one recharges {PRACTICE_RECHARGE} cells.</p>
      <section className="card stack">
        <h2><Icon name="refresh" /> Daily review</h2>
        <p>Old questions come back just before you would forget them: after 1, 2, 4, 8, then 16 days.</p>
        {daily.ids.length === 0
          ? <p className="muted">Nothing to review yet. Finish a lesson first.</p>
          : <>
              <p className="mono small">{daily.due} due today · {daily.ids.length} in this session</p>
              <button className="btn" onClick={() => start(daily.ids)}><Icon name="play" />Start review</button>
            </>}
      </section>
      <section className="card stack">
        <h2><Icon name="target" /> Review mistakes</h2>
        <p>Questions you got wrong stay here until you answer them right in practice.</p>
        {missed.length === 0
          ? <p className="muted">No open mistakes.</p>
          : <button className="btn ghost" onClick={() => start(missed)}><Icon name="play" />Fix {missed.length} {missed.length === 1 ? 'mistake' : 'mistakes'}</button>}
      </section>
      <p><Link href="/">Back to the path</Link></p>
    </div>
  );
}
