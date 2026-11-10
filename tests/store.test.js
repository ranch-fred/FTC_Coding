import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, demoStore, dayOf, DEMO_USER, XP_PER_LESSON } from '../lib/store-demo.js';
import { lessons } from '../lib/lessons.js';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
}
const at = (iso) => new Date(`${iso}T15:00:00`);

test('xp counts completed lessons only', () => {
  const rows = [{ completed: true }, { completed: false }, { completed: true }];
  assert.equal(computeStats(rows, [], '2026-03-10').xp, 2 * XP_PER_LESSON);
});

test('streak counts consecutive days ending today or yesterday', () => {
  const s = (days, today) => computeStats([], days, today).streak;
  assert.equal(s([], '2026-03-10'), 0);
  assert.equal(s(['2026-03-10'], '2026-03-10'), 1);
  assert.equal(s(['2026-03-08', '2026-03-09', '2026-03-10'], '2026-03-10'), 3);
  assert.equal(s(['2026-03-08', '2026-03-09'], '2026-03-10'), 2, 'not practised yet today: still alive');
  assert.equal(s(['2026-03-07', '2026-03-08'], '2026-03-10'), 0, 'missed a full day: reset');
  assert.equal(s(['2026-03-06', '2026-03-09', '2026-03-10'], '2026-03-10'), 2, 'gap ends the run');
  assert.equal(s(['2026-02-28', '2026-03-01'], '2026-03-01'), 2, 'crosses a month boundary');
});

test('dayOf uses the local calendar day', () => {
  assert.equal(dayOf(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('demo store saves, reloads and summarises progress', async () => {
  const storage = fakeStorage();
  let now = at('2026-03-09');
  const store = demoStore(() => storage, () => now);

  assert.equal(await store.loadLesson(DEMO_USER, 'turn'), null);
  assert.deepEqual(await store.summary(DEMO_USER), { done: new Set(), xp: 0, streak: 0 });

  assert.equal(await store.saveLesson(DEMO_USER, 'turn', 'robot.turn(90);', false), '');
  assert.equal(await store.saveLesson(DEMO_USER, 'drive-forward', 'robot.forward(100);', true), '');
  now = at('2026-03-10');
  await store.saveLesson(DEMO_USER, 'turn', 'robot.turn(90); // v2', true);

  const again = demoStore(() => storage, () => now); // a fresh page load sees the same data
  assert.deepEqual(await again.loadLesson(DEMO_USER, 'turn'), {
    code: 'robot.turn(90); // v2', completed: true, updated_at: now.toISOString(),
  });
  assert.deepEqual(await again.summary(DEMO_USER), {
    done: new Set(['turn', 'drive-forward']), xp: 2 * XP_PER_LESSON, streak: 2,
  });
});

test('demo store survives corrupt or blocked storage', async () => {
  const corrupt = demoStore(() => fakeStorage({ 'ftc-practice-v1': '{not json' }));
  assert.equal((await corrupt.summary(DEMO_USER)).xp, 0);

  const blocked = demoStore(() => ({ getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } }));
  assert.match(await blocked.saveLesson(DEMO_USER, 'turn', '', true), /Quota/);
});

test('demo admin table has sample teammates plus your own rows', async () => {
  const storage = fakeStorage();
  const store = demoStore(() => storage, () => at('2026-03-10'));
  await store.saveLesson(DEMO_USER, 'turn', '', true);
  const { isAdmin, rows } = await store.adminData();
  assert.equal(isAdmin, true);
  const emails = new Set(rows.map((r) => r.email));
  assert.ok(emails.size >= 4);
  assert.ok(rows.some((r) => r.email === DEMO_USER.email && r.lesson_id === 'turn' && r.completed));
  const ids = new Set(lessons.map((l) => l.id));
  for (const r of rows) assert.ok(ids.has(r.lesson_id), r.lesson_id);
});
