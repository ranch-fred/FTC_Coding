import test from 'node:test';
import assert from 'node:assert/strict';
import { demoStore, DEMO_USER } from '../lib/store-demo.js';
import { newState, addXp, finishLesson } from '../lib/game.js';
import { lessons } from '../lib/curriculum/index.js';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
}
const NOW = new Date('2026-03-10T15:00:00');
const make = (storage = fakeStorage()) => demoStore(() => storage, () => NOW);

test('demo store starts empty, saves, and reloads the same state', async () => {
  const storage = fakeStorage();
  const store = make(storage);
  assert.deepEqual(await store.load(DEMO_USER), newState());

  const state = finishLesson(newState(), lessons[0], [lessons[0].id], { mistakes: 0 }, NOW).state;
  assert.equal(await store.save(DEMO_USER, state), '');
  assert.deepEqual(await make(storage).load(DEMO_USER), state, 'a fresh page load sees the same data');

  await store.reset();
  assert.deepEqual(await store.load(DEMO_USER), newState());
});

test('demo store survives corrupt or blocked storage', async () => {
  const corrupt = make(fakeStorage({ 'ftc-practice-v2': '{not json' }));
  assert.deepEqual(await corrupt.load(DEMO_USER), newState());

  const blocked = demoStore(() => ({ getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } }));
  assert.match(await blocked.save(DEMO_USER, newState()), /Quota/);
});

test('demo leaderboard: sample teammates, and you only after choosing a name', async () => {
  const storage = fakeStorage();
  const store = make(storage);
  let board = await store.leaderboard(DEMO_USER);
  assert.ok(board.length >= 3);
  assert.equal(board.some((r) => r.you), false, 'opt-in: not listed without a name');
  for (let i = 1; i < board.length; i++) assert.ok(board[i - 1].xp >= board[i].xp, 'sorted by weekly XP');

  await store.save(DEMO_USER, { ...addXp(newState(), 9999, NOW), name: 'Robo' });
  board = await store.leaderboard(DEMO_USER);
  assert.deepEqual(board[0], { name: 'Robo', xp: 9999, you: true });
});

test('demo admin data: sample teammates plus this browser, with real lesson ids', async () => {
  const { isAdmin, rows } = await make().adminData();
  assert.equal(isAdmin, true);
  assert.ok(rows.length >= 4);
  assert.ok(rows.some((r) => r.email === DEMO_USER.email));
  const ids = new Set(lessons.map((l) => l.id));
  for (const r of rows) {
    assert.ok(r.email && r.updated_at && r.state);
    for (const id of Object.keys(r.state.lessons)) assert.ok(ids.has(id), id);
  }
});
