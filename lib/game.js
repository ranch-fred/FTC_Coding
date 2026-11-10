// All game rules: XP, levels, streak, daily goal, battery, unlocking, spaced review, badges.
// Pure functions over one plain "state" object per player. No storage, no React, no clock:
// callers pass `now` (a Date). Both storage backends save this same object.

export const MAX_BATTERY = 5;
export const REFILL_MS = 20 * 60 * 1000; // one cell comes back every 20 minutes
export const HINT_COST = 2; // XP taken off a lesson's reward per hint
export const REPLAY_XP = 3; // XP for repeating a finished lesson
export const PRACTICE_RECHARGE = 2; // cells given back by a practice session
export const GOALS = [20, 30, 50]; // daily XP goal choices
const REVIEW_DAYS = [1, 2, 4, 8, 16]; // days until a question comes back, by how well it is known

const pad = (n) => String(n).padStart(2, '0');
// Local calendar day as YYYY-MM-DD, so streaks follow the student's own midnight.
export const dayOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return dayOf(d);
}

export function newState() {
  return {
    v: 2,
    xp: 0,
    xpByDay: {}, // { 'YYYY-MM-DD': xp earned that day }
    lessons: {}, // { lessonId: { done, mastered, at } }
    review: {}, // { stepId: { box, due, right, wrong, missed } }
    code: {}, // { stepId: last code the student ran }
    battery: { level: MAX_BATTERY, at: 0 },
    goal: 30,
    name: '', // leaderboard display name; empty = not listed
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const count = (v, max = 1e7) => (Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

// Stored data can be missing, old, or edited by hand. Always pass it through here.
export function normalize(raw) {
  const s = newState();
  if (!isObj(raw)) return s;
  s.xp = count(raw.xp);
  for (const k of ['xpByDay', 'lessons', 'review', 'code']) if (isObj(raw[k])) s[k] = raw[k];
  if (isObj(raw.battery)) s.battery = { level: count(raw.battery.level, MAX_BATTERY), at: count(raw.battery.at, 1e15) };
  if (GOALS.includes(raw.goal)) s.goal = raw.goal;
  if (typeof raw.name === 'string') s.name = raw.name.trim().slice(0, 24);
  return s;
}

// ---- XP, levels, streak ----

// Level L starts at 25 * L * (L - 1) XP: 0, 50, 150, 300, 500...
const levelStart = (level) => 25 * level * (level - 1);
export function levelOf(xp) {
  let level = 1;
  while (levelStart(level + 1) <= xp) level++;
  return { level, into: xp - levelStart(level), span: levelStart(level + 1) - levelStart(level) };
}

export function addXp(state, amount, now) {
  const today = dayOf(now);
  return { ...state, xp: state.xp + amount, xpByDay: { ...state.xpByDay, [today]: (state.xpByDay[today] ?? 0) + amount } };
}

export const xpToday = (state, now) => count(state.xpByDay[dayOf(now)]);

// XP over the last 7 days including today.
export function weeklyXp(state, now) {
  const today = dayOf(now);
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += count(state.xpByDay[addDays(today, -i)]);
  return sum;
}

const activeDays = (state) => new Set(Object.keys(state.xpByDay).filter((d) => state.xpByDay[d] > 0));

// Days in a row with XP. Still alive if today has no XP yet; gone after one full missed day.
export function streakOf(state, now) {
  const active = activeDays(state);
  const today = dayOf(now);
  let d = active.has(today) ? today : addDays(today, -1);
  let streak = 0;
  for (; active.has(d); d = addDays(d, -1)) streak++;
  return streak;
}

export function longestStreak(state) {
  const active = activeDays(state);
  let best = 0;
  for (const day of active) {
    if (active.has(addDays(day, -1))) continue; // not the first day of a run
    let n = 1;
    while (active.has(addDays(day, n))) n++;
    best = Math.max(best, n);
  }
  return best;
}

export function lastActive(state) {
  return [...activeDays(state)].sort().pop() ?? null;
}

// ---- Battery ----

// { level, nextMs }: current cells and ms until the next one (0 when full).
export function batteryNow(state, now) {
  const { level, at } = state.battery;
  if (level >= MAX_BATTERY) return { level: MAX_BATTERY, nextMs: 0 };
  const elapsed = Math.max(0, now.getTime() - at);
  const cur = Math.min(MAX_BATTERY, level + Math.floor(elapsed / REFILL_MS));
  return { level: cur, nextMs: cur >= MAX_BATTERY ? 0 : REFILL_MS - (elapsed % REFILL_MS) };
}

function setBattery(state, change, now) {
  const cur = batteryNow(state, now);
  const level = Math.max(0, Math.min(MAX_BATTERY, cur.level + change));
  // Keep the partly filled cell: the clock restarts only when leaving "full".
  const at = cur.level >= MAX_BATTERY ? now.getTime() : now.getTime() - (REFILL_MS - cur.nextMs);
  return { ...state, battery: { level, at } };
}
export const drainBattery = (state, now) => setBattery(state, -1, now);
export const rechargeBattery = (state, cells, now) => setBattery(state, cells, now);

// ---- Lessons and unlocking ----

// order = every lesson id in course order. A lesson opens when the one before it is done.
export function lessonStatus(state, order, lessonId) {
  const rec = state.lessons[lessonId];
  if (rec?.done) return rec.mastered ? 'mastered' : 'done';
  const i = order.indexOf(lessonId);
  if (i < 0) return 'locked';
  if (i > 0 && !state.lessons[order[i - 1]]?.done) return 'locked';
  return rec ? 'started' : 'available';
}

export function startLesson(state, lessonId) {
  if (state.lessons[lessonId]) return state;
  return { ...state, lessons: { ...state.lessons, [lessonId]: { done: false, mastered: false } } };
}

export const saveCode = (state, stepId, code) => ({ ...state, code: { ...state.code, [stepId]: code } });

// lesson = { id, xp }, unitLessonIds = ids of the lessons in its unit.
// Returns { state, earned, first, mastered, leveledUp, level, unitDone }.
export function finishLesson(state, lesson, unitLessonIds, { mistakes = 0, hints = 0 }, now) {
  const rec = state.lessons[lesson.id];
  const first = !rec?.done;
  const earned = first ? Math.max(1, lesson.xp - hints * HINT_COST) : REPLAY_XP;
  const mastered = Boolean(rec?.mastered) || mistakes === 0; // gold: finished once with no wrong answers
  const before = levelOf(state.xp).level;
  let next = addXp(state, earned, now);
  next = { ...next, lessons: { ...next.lessons, [lesson.id]: { done: true, mastered, at: now.toISOString() } } };
  const level = levelOf(next.xp).level;
  const unitDone = first && unitLessonIds.every((id) => next.lessons[id]?.done);
  return { state: next, earned, first, mastered, leveledUp: level > before, level, unitDone };
}

// ---- Review (spaced repetition) ----

// Record one quiz answer. Wrong: comes back today and is marked as a mistake.
// Right: comes back later each time (1, 2, 4, 8, 16 days). A mistake is only cleared in practice.
export function recordAnswer(state, stepId, correct, now, { practice = false } = {}) {
  const today = dayOf(now);
  const r = { box: 0, due: today, right: 0, wrong: 0, missed: false, ...state.review[stepId] };
  if (!correct) Object.assign(r, { wrong: r.wrong + 1, box: 0, due: today, missed: true });
  else if (r.missed && !practice) r.right += 1; // fixed inside the same lesson: still due for practice
  else {
    r.right += 1;
    r.due = addDays(today, REVIEW_DAYS[Math.min(r.box, REVIEW_DAYS.length - 1)]);
    r.box = Math.min(r.box + 1, REVIEW_DAYS.length - 1);
    r.missed = false;
  }
  return { ...state, review: { ...state.review, [stepId]: r } };
}

// validIds = ids of quiz steps that still exist in the curriculum.
// Daily practice: due questions first, then the ones due soonest. { ids, due }.
export function practiceSet(state, validIds, now, limit = 8) {
  const today = dayOf(now);
  const seen = validIds.filter((id) => state.review[id]);
  seen.sort((a, b) => {
    const ra = state.review[a];
    const rb = state.review[b];
    return ra.due < rb.due ? -1 : ra.due > rb.due ? 1 : rb.wrong - ra.wrong;
  });
  return { ids: seen.slice(0, limit), due: seen.filter((id) => state.review[id].due <= today).length };
}

export function mistakeSet(state, validIds, limit = 10) {
  return validIds
    .filter((id) => state.review[id]?.missed)
    .sort((a, b) => state.review[b].wrong - state.review[a].wrong)
    .slice(0, limit);
}

// Practice gives 1 XP per first-try correct answer (at least 1) and recharges the battery.
export function finishPractice(state, correct, now) {
  const earned = Math.max(1, correct);
  const before = levelOf(state.xp).level;
  const next = rechargeBattery(addXp(state, earned, now), PRACTICE_RECHARGE, now);
  const level = levelOf(next.xp).level;
  return { state: next, earned, leveledUp: level > before, level };
}

// ---- Badges ----

// units = [{ id, title, badge: { name, desc }, lessons: [{ id }] }]. Badges are worked out from state, never stored.
export function badges(state, units) {
  const recs = Object.values(state.lessons);
  const done = recs.filter((r) => r.done).length;
  const gold = recs.filter((r) => r.mastered).length;
  const longest = longestStreak(state);
  const list = [
    { id: 'first-lesson', icon: 'power', name: 'Powered on', desc: 'Finish your first lesson.', earned: done >= 1 },
    { id: 'gold-1', icon: 'star', name: 'Clean run', desc: 'Finish a lesson with no wrong answers.', earned: gold >= 1 },
    { id: 'gold-5', icon: 'star', name: 'Precision', desc: 'Get gold on five lessons.', earned: gold >= 5 },
    { id: 'streak-3', icon: 'streak', name: 'Three in a row', desc: 'Practise three days in a row.', earned: longest >= 3 },
    { id: 'streak-7', icon: 'streak', name: 'Full week', desc: 'Practise seven days in a row.', earned: longest >= 7 },
    { id: 'xp-100', icon: 'bolt', name: '100 XP', desc: 'Earn 100 XP.', earned: state.xp >= 100 },
    { id: 'xp-500', icon: 'bolt', name: '500 XP', desc: 'Earn 500 XP.', earned: state.xp >= 500 },
  ];
  for (const u of units) {
    list.push({
      id: `unit-${u.id}`,
      icon: 'chip',
      name: u.badge?.name ?? u.title,
      desc: u.badge?.desc ?? `Finish every lesson in ${u.title}.`,
      earned: u.lessons.length > 0 && u.lessons.every((l) => state.lessons[l.id]?.done),
    });
  }
  return list;
}

export const unitsDone = (state, units) =>
  units.filter((u) => u.lessons.length > 0 && u.lessons.every((l) => state.lessons[l.id]?.done));
