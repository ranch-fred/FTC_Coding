// Demo backend: progress lives in localStorage. Also holds the pure XP/streak maths both backends share.
import { lessons } from './lessons.js';

export const XP_PER_LESSON = 10;
export const DEMO_USER = { id: 'demo', email: 'you@demo.local' };
const KEY = 'ftc-practice-v1';

const pad = (n) => String(n).padStart(2, '0');
// Local calendar day as YYYY-MM-DD, so a streak follows the student's own midnight.
export const dayOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function prevDay(day) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return dayOf(d);
}

// rows: [{ completed }], days: active days (YYYY-MM-DD). The streak survives until a full day is missed.
export function computeStats(rows, days, today = dayOf()) {
  const active = new Set(days);
  let d = active.has(today) ? today : prevDay(today);
  let streak = 0;
  for (; active.has(d); d = prevDay(d)) streak++;
  return { xp: rows.filter((r) => r.completed).length * XP_PER_LESSON, streak };
}

// Made-up teammates so the mentor table has something to show without a database.
function sampleRows(now) {
  const team = [['ava@demo.local', 6, 0], ['ben@demo.local', 3, 2], ['chen@demo.local', 1, 9]];
  return team.flatMap(([email, count, daysAgo]) =>
    lessons.slice(0, count).map((l) => ({
      email,
      lesson_id: l.id,
      completed: true,
      updated_at: new Date(now.getTime() - daysAgo * 864e5).toISOString(),
    })),
  );
}

// getStorage is a function so nothing touches localStorage during server rendering.
export function demoStore(getStorage, now = () => new Date()) {
  const read = () => {
    try {
      const s = JSON.parse(getStorage().getItem(KEY));
      if (s && typeof s.lessons === 'object' && Array.isArray(s.days)) return s;
    } catch { /* missing or corrupt: start fresh */ }
    return { lessons: {}, days: [] };
  };
  const rows = (s) => Object.entries(s.lessons).map(([lesson_id, r]) => ({ lesson_id, ...r }));

  return {
    async summary() {
      const s = read();
      const r = rows(s);
      return { done: new Set(r.filter((x) => x.completed).map((x) => x.lesson_id)), ...computeStats(r, s.days, dayOf(now())) };
    },
    async loadLesson(_user, lessonId) {
      return read().lessons[lessonId] ?? null;
    },
    // Returns '' on success or an error message.
    async saveLesson(_user, lessonId, code, completed) {
      const s = read();
      s.lessons[lessonId] = { code, completed, updated_at: now().toISOString() };
      const today = dayOf(now());
      if (!s.days.includes(today)) s.days.push(today);
      try {
        getStorage().setItem(KEY, JSON.stringify(s));
        return '';
      } catch (e) {
        return e.message || 'Browser storage is full or blocked.';
      }
    },
    async adminData() {
      const mine = rows(read()).map((r) => ({ ...r, email: DEMO_USER.email }));
      return { isAdmin: true, rows: [...sampleRows(now()), ...mine] };
    },
  };
}
