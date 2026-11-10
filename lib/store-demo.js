// Demo backend: the player's state lives in localStorage. Used when no Supabase keys are set.
import { lessons, quizSteps } from './curriculum/index.js';
import { normalize, newState, dayOf, addDays, weeklyXp } from './game.js';

export const DEMO_USER = { id: 'demo', email: 'you@demo.local' };
const KEY = 'ftc-practice-v2';

// Made-up teammates so the mentor view and leaderboard have something to show without a database.
// [name, lessons finished, days since last practice, days practised in a row, wrong answers per missed question]
const TEAM = [
  ['Ava', 7, 0, 6, 1],
  ['Ben', 4, 1, 2, 2],
  ['Chen', 2, 9, 1, 3],
];

function sampleRows(now) {
  const today = dayOf(now);
  return TEAM.map(([name, done, idle, run, misses], t) => {
    const s = newState();
    s.name = name;
    const last = addDays(today, -idle);
    lessons.slice(0, done).forEach((l, i) => {
      s.lessons[l.id] = { done: true, mastered: (i + t) % 2 === 0, at: `${last}T17:00:00.000Z` };
      s.xp += l.xp;
    });
    for (let i = 0; i < run; i++) s.xpByDay[addDays(last, -i)] = Math.round(s.xp / run);
    quizSteps.filter((q) => s.lessons[q.lessonId]).forEach((q, i) => {
      const wrong = (i + t) % 3 === 0 ? misses : 0;
      s.review[q.id] = { box: wrong ? 0 : 2, due: today, right: 1, wrong, missed: wrong > 0 };
    });
    return { email: `${name.toLowerCase()}@demo.local`, updated_at: `${last}T17:00:00.000Z`, state: s };
  });
}

// getStorage is a function so nothing touches localStorage during server rendering.
export function demoStore(getStorage, now = () => new Date()) {
  const read = () => {
    try {
      return normalize(JSON.parse(getStorage().getItem(KEY)));
    } catch {
      return newState(); // missing or corrupt: start fresh
    }
  };

  return {
    async load() {
      return read();
    },
    // Returns '' on success or an error message.
    async save(_user, state) {
      try {
        getStorage().setItem(KEY, JSON.stringify(state));
        return '';
      } catch (e) {
        return e.message || 'Browser storage is full or blocked.';
      }
    },
    // [{ name, xp, you }] sorted by weekly XP. You appear only after choosing a display name.
    async leaderboard() {
      const me = read();
      const rows = sampleRows(now()).map((r) => ({ name: r.state.name, xp: weeklyXp(r.state, now()), you: false }));
      if (me.name) rows.push({ name: me.name, xp: weeklyXp(me, now()), you: true });
      return rows.sort((a, b) => b.xp - a.xp);
    },
    async adminData() {
      const mine = { email: DEMO_USER.email, updated_at: now().toISOString(), state: read() };
      return { isAdmin: true, rows: [...sampleRows(now()), mine] };
    },
    async reset() {
      getStorage().removeItem(KEY);
    },
  };
}
