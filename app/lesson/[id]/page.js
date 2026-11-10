'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Player from '../../../components/Player';
import Celebrate from '../../../components/Celebrate';
import Icon from '../../../components/Icon';
import { useGame, useNow } from '../../../components/Game';
import { getLesson, getUnit, lessonOrder } from '../../../lib/curriculum';
import { lessonStatus, startLesson, finishLesson, batteryNow, streakOf } from '../../../lib/game';

function Lesson({ lesson }) {
  const { state, apply } = useGame();
  const now = useNow();
  const unit = getUnit(lesson.unitId);
  // Decided once on entry: finishing the lesson must not flip this screen to something else.
  const [entry] = useState(() => ({ status: lessonStatus(state, lessonOrder, lesson.id), battery: batteryNow(state, new Date()).level }));
  const [phase, setPhase] = useState('play'); // play | done | flat
  const [summary, setSummary] = useState(null);
  const blocked = entry.status === 'locked' || entry.battery === 0;

  useEffect(() => {
    if (!blocked) apply((s) => startLesson(s, lesson.id));
  }, [apply, lesson.id, blocked]);

  if (entry.status === 'locked') {
    return (
      <div className="stack">
        <h1><Icon name="lock" /> {lesson.title} is locked</h1>
        <p>Finish the lesson before it first.</p>
        <p><Link href="/" className="btn">Back to the path</Link></p>
      </div>
    );
  }
  if (entry.battery === 0 || phase === 'flat') {
    const b = batteryNow(state, now);
    return (
      <div className="stack">
        <h1>Battery flat</h1>
        <p>Wrong answers drain the battery. {b.level === 0
          ? `One cell comes back in ${Math.ceil(b.nextMs / 60000)} min, or recharge now with a practice session.`
          : 'A cell has recharged: you can start again.'}</p>
        <div className="row">
          <Link href="/practice" className="btn"><Icon name="refresh" />Practice to recharge</Link>
          <Link href="/" className="btn ghost">Back to the path</Link>
        </div>
      </div>
    );
  }
  if (phase === 'done') {
    const banners = [];
    if (summary.leveledUp) banners.push(['bolt', `Level up! You are now level ${summary.level}.`]);
    if (summary.unitDone) banners.push(['chip', `Unit complete: ${unit.title}. Badge earned: ${unit.badge?.name ?? unit.title}.`]);
    return (
      <Celebrate
        title={lesson.boss ? 'Boss beaten!' : 'Lesson complete'}
        gold={summary.mistakes === 0}
        tiles={[['XP earned', `+${summary.earned}`], ['Day streak', streakOf(state, now)], ['Mistakes', summary.mistakes]]}
        banners={banners}
      />
    );
  }
  return (
    <Player
      steps={lesson.steps}
      mode="lesson"
      onFlat={() => setPhase('flat')}
      onDone={({ mistakes, hints }) => {
        const out = apply((s, t) => finishLesson(s, lesson, unit.lessons.map((l) => l.id), { mistakes, hints }, t));
        setSummary({ ...out, mistakes });
        setPhase('done');
      }}
    />
  );
}

export default function Page() {
  const { id } = useParams();
  const lesson = getLesson(id);
  if (!lesson) return <p>Lesson not found. <Link href="/">Back to the path</Link></p>;
  return <Lesson key={lesson.id} lesson={lesson} />;
}
