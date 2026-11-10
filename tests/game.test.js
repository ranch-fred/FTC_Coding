import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newState, normalize, dayOf, addDays, levelOf, addXp, xpToday, weeklyXp, streakOf, longestStreak, lastActive,
  batteryNow, drainBattery, rechargeBattery, lessonStatus, startLesson, finishLesson, recordAnswer,
  practiceSet, mistakeSet, finishPractice, badges, unitsDone, saveCode,
  MAX_BATTERY, REFILL_MS, HINT_COST, REPLAY_XP, PRACTICE_RECHARGE,
} from '../lib/game.js';

const at = (day, time = '15:00:00') => new Date(`${day}T${time}`);
const D = at('2026-03-10');
const withDays = (...days) => ({ ...newState(), xpByDay: Object.fromEntries(days.map((d) => [d, 10])) });

test('dates: local day and day arithmetic across months', () => {
  assert.equal(dayOf(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('normalize repairs missing or hostile stored data', () => {
  assert.deepEqual(normalize(null), newState());
  assert.deepEqual(normalize('junk'), newState());
  const s = normalize({ xp: -5, goal: 999, name: `  ${'x'.repeat(40)}  `, battery: { level: 99, at: 'no' }, lessons: [] });
  assert.equal(s.xp, 0);
  assert.equal(s.goal, 30);
  assert.equal(s.name.length, 24);
  assert.deepEqual(s.battery, { level: MAX_BATTERY, at: 0 });
  assert.deepEqual(s.lessons, {});
});

test('levels: 0, 50, 150, 300 XP start levels 1 to 4', () => {
  assert.deepEqual(levelOf(0), { level: 1, into: 0, span: 50 });
  assert.equal(levelOf(49).level, 1);
  assert.deepEqual(levelOf(50), { level: 2, into: 0, span: 100 });
  assert.equal(levelOf(149).level, 2);
  assert.equal(levelOf(150).level, 3);
  assert.equal(levelOf(300).level, 4);
});

test('xp is added to the total and to the day', () => {
  let s = addXp(newState(), 10, D);
  s = addXp(s, 5, D);
  s = addXp(s, 7, at('2026-03-04'));
  s = addXp(s, 100, at('2026-03-03'));
  assert.equal(s.xp, 122);
  assert.equal(xpToday(s, D), 15);
  assert.equal(weeklyXp(s, D), 22, 'last 7 days: 4 March counts, 3 March does not');
});

test('streak counts days in a row ending today or yesterday', () => {
  assert.equal(streakOf(newState(), D), 0);
  assert.equal(streakOf(withDays('2026-03-10'), D), 1);
  assert.equal(streakOf(withDays('2026-03-08', '2026-03-09', '2026-03-10'), D), 3);
  assert.equal(streakOf(withDays('2026-03-08', '2026-03-09'), D), 2, 'not practised yet today: still alive');
  assert.equal(streakOf(withDays('2026-03-07', '2026-03-08'), D), 0, 'missed a full day: reset');
  assert.equal(streakOf(withDays('2026-03-06', '2026-03-09', '2026-03-10'), D), 2, 'a gap ends the run');
  assert.equal(streakOf(withDays('2026-02-28', '2026-03-01'), at('2026-03-01')), 2, 'crosses a month');
});

test('longest streak and last active day', () => {
  const s = withDays('2026-01-01', '2026-01-02', '2026-01-03', '2026-02-10', '2026-02-11');
  assert.equal(longestStreak(s), 3);
  assert.equal(lastActive(s), '2026-02-11');
  assert.equal(longestStreak(newState()), 0);
  assert.equal(lastActive(newState()), null);
});

test('battery drains on wrong answers and refills one cell per interval', () => {
  let s = newState();
  assert.deepEqual(batteryNow(s, D), { level: MAX_BATTERY, nextMs: 0 });
  s = drainBattery(s, D);
  assert.deepEqual(batteryNow(s, D), { level: 4, nextMs: REFILL_MS });
  const later = new Date(D.getTime() + REFILL_MS / 2);
  s = drainBattery(s, later);
  assert.equal(batteryNow(s, later).level, 3);
  assert.equal(batteryNow(s, later).nextMs, REFILL_MS / 2, 'draining again keeps the partly filled cell');
  assert.equal(batteryNow(s, new Date(D.getTime() + REFILL_MS)).level, 4);
  assert.deepEqual(batteryNow(s, new Date(D.getTime() + 10 * REFILL_MS)), { level: MAX_BATTERY, nextMs: 0 });
});

test('battery never goes below zero or above full', () => {
  let s = newState();
  for (let i = 0; i < 8; i++) s = drainBattery(s, D);
  assert.equal(batteryNow(s, D).level, 0);
  s = rechargeBattery(s, 2, D);
  assert.equal(batteryNow(s, D).level, 2);
  s = rechargeBattery(s, 99, D);
  assert.equal(batteryNow(s, D).level, MAX_BATTERY);
});

test('unlock: lessons open in order', () => {
  const order = ['a', 'b', 'c'];
  let s = newState();
  assert.deepEqual(order.map((id) => lessonStatus(s, order, id)), ['available', 'locked', 'locked']);
  s = startLesson(s, 'a');
  assert.equal(lessonStatus(s, order, 'a'), 'started');
  assert.equal(lessonStatus(s, order, 'b'), 'locked', 'starting is not finishing');
  s = finishLesson(s, { id: 'a', xp: 10 }, order, { mistakes: 2 }, D).state;
  assert.deepEqual(order.map((id) => lessonStatus(s, order, id)), ['done', 'available', 'locked']);
  s = finishLesson(s, { id: 'b', xp: 10 }, order, { mistakes: 0 }, D).state;
  assert.deepEqual(order.map((id) => lessonStatus(s, order, id)), ['done', 'mastered', 'available']);
  assert.equal(lessonStatus(s, order, 'nope'), 'locked');
  assert.equal(startLesson(s, 'a'), s, 'starting again changes nothing');
});

test('finishing a lesson: XP, hint cost, replay XP, gold', () => {
  const lesson = { id: 'a', xp: 10 };
  const first = finishLesson(newState(), lesson, ['a', 'b'], { mistakes: 1, hints: 2 }, D);
  assert.equal(first.earned, 10 - 2 * HINT_COST);
  assert.equal(first.first, true);
  assert.equal(first.mastered, false);
  assert.equal(first.unitDone, false);
  assert.equal(first.state.xp, 6);
  assert.equal(xpToday(first.state, D), 6);

  const replay = finishLesson(first.state, lesson, ['a', 'b'], { mistakes: 0 }, D);
  assert.equal(replay.earned, REPLAY_XP, 'no farming full XP by repeating');
  assert.equal(replay.mastered, true, 'a clean replay earns gold');
  assert.equal(finishLesson(replay.state, lesson, ['a', 'b'], { mistakes: 3 }, D).mastered, true, 'gold is kept');

  assert.equal(finishLesson(newState(), lesson, ['a'], { hints: 50 }, D).earned, 1, 'hints never take XP below 1');
});

test('finishing a lesson reports level-up and unit completion once', () => {
  let s = { ...newState(), xp: 45 };
  const a = finishLesson(s, { id: 'a', xp: 10 }, ['a', 'b'], {}, D);
  assert.equal(a.leveledUp, true);
  assert.equal(a.level, 2);
  assert.equal(a.unitDone, false);
  const b = finishLesson(a.state, { id: 'b', xp: 10 }, ['a', 'b'], {}, D);
  assert.equal(b.leveledUp, false);
  assert.equal(b.unitDone, true);
  assert.equal(finishLesson(b.state, { id: 'b', xp: 10 }, ['a', 'b'], {}, D).unitDone, false, 'replay does not celebrate again');
});

test('review: right answers come back after 1, 2, 4, 8, 16 days', () => {
  let s = newState();
  const gaps = [];
  let day = '2026-03-10';
  for (let i = 0; i < 6; i++) {
    s = recordAnswer(s, 'q', true, at(day), { practice: true });
    gaps.push((new Date(s.review.q.due) - new Date(day)) / 864e5);
    day = s.review.q.due;
  }
  assert.deepEqual(gaps, [1, 2, 4, 8, 16, 16]);
  assert.equal(s.review.q.right, 6);
});

test('review: a wrong answer is due today and stays a mistake until fixed in practice', () => {
  let s = recordAnswer(newState(), 'q', true, D);
  s = recordAnswer(s, 'q', true, D);
  s = recordAnswer(s, 'q', false, D);
  assert.deepEqual(s.review.q, { box: 0, due: '2026-03-10', right: 2, wrong: 1, missed: true });
  s = recordAnswer(s, 'q', true, D); // answered right when it came back inside the lesson
  assert.equal(s.review.q.missed, true);
  assert.equal(s.review.q.due, '2026-03-10');
  assert.deepEqual(mistakeSet(s, ['q']), ['q']);
  s = recordAnswer(s, 'q', true, D, { practice: true });
  assert.equal(s.review.q.missed, false);
  assert.equal(s.review.q.due, '2026-03-11');
  assert.deepEqual(mistakeSet(s, ['q']), []);
});

test('practice set: due first, then soonest; ignores unseen and deleted questions', () => {
  let s = newState();
  s = recordAnswer(s, 'later', true, D);
  s = recordAnswer(s, 'wrong', false, D);
  s = recordAnswer(s, 'old', true, at('2026-03-01'));
  s = recordAnswer(s, 'deleted', false, D);
  const set = practiceSet(s, ['later', 'wrong', 'old', 'unseen'], D);
  assert.deepEqual(set.ids, ['old', 'wrong', 'later']);
  assert.equal(set.due, 2);
  assert.deepEqual(practiceSet(s, ['later', 'wrong', 'old'], D, 1).ids, ['old']);
  assert.deepEqual(practiceSet(newState(), ['a'], D), { ids: [], due: 0 });
});

test('finishing practice gives XP and recharges the battery', () => {
  let s = newState();
  for (let i = 0; i < 5; i++) s = drainBattery(s, D);
  const out = finishPractice(s, 6, D);
  assert.equal(out.earned, 6);
  assert.equal(batteryNow(out.state, D).level, PRACTICE_RECHARGE);
  assert.equal(finishPractice(s, 0, D).earned, 1, 'showing up always counts for the streak');
  assert.equal(streakOf(finishPractice(s, 0, D).state, D), 1);
});

test('badges and completed units come from state', () => {
  const units = [
    { id: 'u1', title: 'One', badge: { name: 'First', desc: 'd' }, lessons: [{ id: 'a' }, { id: 'b' }] },
    { id: 'u2', title: 'Two', lessons: [{ id: 'c' }] },
  ];
  const earned = (s) => badges(s, units).filter((b) => b.earned).map((b) => b.id);
  assert.deepEqual(earned(newState()), []);
  let s = finishLesson(newState(), { id: 'a', xp: 10 }, ['a', 'b'], { mistakes: 0 }, D).state;
  assert.deepEqual(earned(s), ['first-lesson', 'gold-1']);
  s = finishLesson(s, { id: 'b', xp: 100 }, ['a', 'b'], { mistakes: 1 }, at('2026-03-11')).state;
  s = addXp(s, 1, at('2026-03-12'));
  assert.deepEqual(earned(s), ['first-lesson', 'gold-1', 'streak-3', 'xp-100', 'unit-u1']);
  assert.deepEqual(unitsDone(s, units).map((u) => u.id), ['u1']);
  assert.equal(badges(s, units).find((b) => b.id === 'unit-u2').name, 'Two');
});

test('saved code is kept per step', () => {
  const s = saveCode(saveCode(newState(), 'a/1', 'x'), 'b/1', 'y');
  assert.deepEqual(s.code, { 'a/1': 'x', 'b/1': 'y' });
});
