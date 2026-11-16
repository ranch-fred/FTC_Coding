// Mentor view maths. Pure functions over the rows that store.adminData() returns:
// rows = [{ email, updated_at, state }] where state is a player state from lib/game.js.
import { levelOf, streakOf, longestStreak, lastActive, weeklyXp, dayOf } from './game.js';

const daysBetween = (from, to) => Math.round((new Date(`${to}T12:00:00`) - new Date(`${from}T12:00:00`)) / 864e5);

// One summary per teammate, sorted by most recently active.
// units = [{ id, title, lessons: [{ id, title }] }]
export function teamSummary(rows, units, now) {
  const today = dayOf(now);
  return rows
    .map(({ email, state }) => {
      const status = (id) => {
        const rec = state.lessons[id];
        return rec?.done ? (rec.mastered ? 'gold' : 'done') : rec ? 'started' : 'none';
      };
      const perUnit = units.map((u) => {
        const lessons = u.lessons.map((l) => ({ id: l.id, title: l.title, status: status(l.id) }));
        return { id: u.id, title: u.title, lessons, done: lessons.filter((l) => l.status === 'done' || l.status === 'gold').length, total: lessons.length };
      });
      const last = lastActive(state);
      const answers = Object.values(state.review);
      return {
        email,
        name: state.name,
        xp: state.xp,
        level: levelOf(state.xp).level,
        weekXp: weeklyXp(state, now),
        streak: streakOf(state, now),
        bestStreak: longestStreak(state),
        lastActive: last,
        idleDays: last ? daysBetween(last, today) : null, // null = never practised
        done: perUnit.reduce((n, u) => n + u.done, 0),
        gold: perUnit.reduce((n, u) => n + u.lessons.filter((l) => l.status === 'gold').length, 0),
        total: perUnit.reduce((n, u) => n + u.total, 0),
        openMistakes: answers.filter((r) => r.missed).length,
        units: perUnit,
      };
    })
    .sort((a, b) => (b.lastActive ?? '').localeCompare(a.lastActive ?? '') || a.email.localeCompare(b.email));
}

// The questions the team gets wrong most. steps = quiz steps [{ id, lessonId, prompt, type }].
// Returns [{ id, lessonId, prompt, type, wrong, right, missedBy, tried, rate }], most wrong answers first.
// Questions that no longer exist in the course are ignored.
export function hardestQuestions(rows, steps, limit = 10) {
  const out = [];
  for (const step of steps) {
    let wrong = 0;
    let right = 0;
    let missedBy = 0;
    let tried = 0;
    for (const { state } of rows) {
      const r = state.review[step.id];
      if (!r) continue;
      tried++;
      wrong += r.wrong ?? 0;
      right += r.right ?? 0;
      if (r.wrong > 0) missedBy++;
    }
    if (wrong > 0) out.push({ id: step.id, lessonId: step.lessonId, prompt: step.prompt, type: step.type, wrong, right, missedBy, tried, rate: wrong / (wrong + right) });
  }
  return out.sort((a, b) => b.wrong - a.wrong || b.missedBy - a.missedBy || a.id.localeCompare(b.id)).slice(0, limit);
}
