import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { teamSummary, hardestQuestions } from '../lib/admin.js';
import { newState, finishLesson, recordAnswer, addXp } from '../lib/game.js';
import { units as course } from '../lib/curriculum/index.js';

const at = (day) => new Date(`${day}T15:00:00`);
const NOW = at('2026-03-10');
const units = [
  { id: 'u1', title: 'One', lessons: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }] },
  { id: 'u2', title: 'Two', lessons: [{ id: 'c', title: 'C' }] },
];
const lesson = (id) => ({ id, xp: 10 });

function team() {
  let ava = newState();
  ava = finishLesson(ava, lesson('a'), ['a', 'b'], { mistakes: 0 }, at('2026-03-09')).state;
  ava = finishLesson(ava, lesson('b'), ['a', 'b'], { mistakes: 2 }, NOW).state;
  ava = recordAnswer(ava, 'a/2', false, NOW);
  ava = recordAnswer(ava, 'a/2', true, NOW);
  ava = { ...ava, name: 'Ava', lessons: { ...ava.lessons, c: { done: false, mastered: false } } };

  let ben = addXp(newState(), 5, at('2026-03-01'));
  ben = recordAnswer(ben, 'a/2', false, at('2026-03-01'));
  ben = recordAnswer(ben, 'a/2', false, at('2026-03-01'));
  ben = recordAnswer(ben, 'a/3', false, at('2026-03-01'));
  ben = recordAnswer(ben, 'gone/1', false, at('2026-03-01'));

  return [
    { email: 'new@x.org', updated_at: '', state: newState() },
    { email: 'ben@x.org', updated_at: '', state: ben },
    { email: 'ava@x.org', updated_at: '', state: ava },
  ];
}

test('team summary: per-teammate totals, streak, last active, sorted by most recent', () => {
  const [ava, ben, fresh] = teamSummary(team(), units, NOW);
  assert.equal(ava.email, 'ava@x.org');
  assert.equal(ava.name, 'Ava');
  assert.equal(ava.xp, 20);
  assert.equal(ava.weekXp, 20);
  assert.equal(ava.streak, 2);
  assert.equal(ava.lastActive, '2026-03-10');
  assert.equal(ava.idleDays, 0);
  assert.deepEqual([ava.done, ava.gold, ava.total], [2, 1, 3]);
  assert.equal(ava.openMistakes, 1);

  assert.equal(ben.email, 'ben@x.org');
  assert.equal(ben.streak, 0);
  assert.equal(ben.idleDays, 9);
  assert.equal(ben.weekXp, 0);

  assert.equal(fresh.lastActive, null);
  assert.equal(fresh.idleDays, null);
  assert.equal(fresh.done, 0);
});

test('team summary: progress by unit and lesson', () => {
  const [ava] = teamSummary(team(), units, NOW);
  assert.deepEqual(ava.units.map((u) => [u.id, u.done, u.total]), [['u1', 2, 2], ['u2', 0, 1]]);
  assert.deepEqual(ava.units[0].lessons.map((l) => l.status), ['gold', 'done']);
  assert.deepEqual(ava.units[1].lessons.map((l) => l.status), ['started']);
});

test('hardest questions: most wrong answers first, with how many teammates missed each', () => {
  const steps = [
    { id: 'a/2', lessonId: 'a', prompt: 'Two?', type: 'choice' },
    { id: 'a/3', lessonId: 'a', prompt: 'Three?', type: 'blank' },
    { id: 'a/4', lessonId: 'a', prompt: 'Never missed', type: 'choice' },
  ];
  const hard = hardestQuestions(team(), steps);
  assert.deepEqual(hard.map((h) => h.id), ['a/2', 'a/3'], 'unmissed and deleted questions are left out');
  assert.deepEqual({ wrong: hard[0].wrong, right: hard[0].right, missedBy: hard[0].missedBy, tried: hard[0].tried }, { wrong: 3, right: 1, missedBy: 2, tried: 2 });
  assert.equal(hard[0].rate, 0.75);
  assert.equal(hardestQuestions(team(), steps, 1).length, 1);
  assert.deepEqual(hardestQuestions([], steps), []);
});

test('every unit names the file a mentor edits, and the file exists', () => {
  for (const u of course) assert.ok(existsSync(new URL(`../lib/curriculum/${u.file}`, import.meta.url)), `${u.id}: ${u.file}`);
});
