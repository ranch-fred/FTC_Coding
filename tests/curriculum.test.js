// Checks every unit file: structure, ids, answers, and a passing reference solution per programming step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { units, lessons, quizSteps, codeSteps, isCode, isQuiz, getStep, randomStart } from '../lib/curriculum/index.js';
import { runProgram, FIELD } from '../lib/sim.js';
import { grade, blankCount, CELL } from '../lib/grade.js';
import { solutions } from './solutions.js';

const TYPES = ['card', 'choice', 'order', 'blank', 'predict', 'fix', 'code'];
const steps = lessons.flatMap((l) => l.steps);

// Every start a field can produce: the fixed one, or each corner of its random ranges.
function starts(field) {
  const xs = field.randomX ?? [undefined];
  const ys = field.randomY ?? [undefined];
  const hs = field.randomH ?? [undefined];
  const out = [];
  for (const x of xs) for (const y of ys) for (const h of hs) {
    const s = {};
    if (x !== undefined) s.x = x;
    if (y !== undefined) s.y = y;
    if (h !== undefined) s.h = h;
    out.push(s);
  }
  return out;
}

test('ids are unique and every lesson has steps', () => {
  const unique = (list, what) => assert.equal(new Set(list).size, list.length, `duplicate ${what}`);
  unique(units.map((u) => u.id), 'unit id');
  unique(lessons.map((l) => l.id), 'lesson id');
  unique(steps.map((s) => s.id), 'step id');
  for (const u of units) {
    assert.ok(u.title && u.blurb && u.matchDay && u.badge?.name, `unit ${u.id} needs title, blurb, matchDay, badge`);
    assert.ok(u.lessons.length > 0, `unit ${u.id} has no lessons`);
  }
  for (const l of lessons) {
    assert.ok(l.title && l.steps.length > 0, l.id);
    assert.ok(l.xp > 0, `${l.id} xp`);
    assert.ok(l.steps.some((s) => s.type !== 'card'), `${l.id} needs at least one question`);
  }
});

test('every step is well formed', () => {
  for (const s of steps) {
    assert.ok(TYPES.includes(s.type), `${s.id}: unknown type ${s.type}`);
    if (s.type === 'card') {
      assert.ok(s.title && Array.isArray(s.body) && s.body.length, `${s.id}: card needs title and body[]`);
      continue;
    }
    assert.ok(s.prompt, `${s.id}: prompt`);
    if (isQuiz(s)) assert.ok(s.explain, `${s.id}: quiz steps need an explanation for wrong answers`);
    if (s.type === 'choice') {
      assert.ok(s.options.length >= 2 && Number.isInteger(s.answer) && s.answer < s.options.length, `${s.id}: options/answer`);
      assert.equal(new Set(s.options).size, s.options.length, `${s.id}: duplicate options`);
    }
    if (s.type === 'order') assert.ok(s.lines.length >= 2, `${s.id}: lines`);
    if (s.type === 'blank') assert.equal(blankCount(s), s.answers.length, `${s.id}: one answer per ___`);
    if (isCode(s)) {
      assert.equal(typeof s.starter, 'string', `${s.id}: starter`);
      assert.ok(s.field?.start && s.field.goal, `${s.id}: field needs start and goal`);
      assert.ok(s.hint, `${s.id}: programming steps need a hint`);
    }
  }
});

test('the right answer to every quiz step grades as correct', () => {
  for (const s of quizSteps) {
    const right =
      s.type === 'choice' ? s.answer
      : s.type === 'order' ? s.lines
      : s.type === 'blank' ? s.answers.map((a) => [].concat(a)[0])
      : grade(s, null).cell;
    assert.equal(grade(s, right).correct, true, s.id);
    assert.equal(getStep(s.id), s);
  }
});

test('predict steps run cleanly and stop well inside one square', () => {
  for (const s of quizSteps.filter((q) => q.type === 'predict')) {
    const r = runProgram(s.code, s.field);
    assert.equal(r.error, null, s.id);
    for (const v of [r.end.x, r.end.y]) {
      const edge = Math.min(v % CELL, CELL - (v % CELL));
      assert.ok(edge >= 5 || v < 5 || v > FIELD - 5, `${s.id}: ends ${edge.toFixed(1)} cm from a grid line; move it`);
    }
  }
});

test('every programming step has a reference solution that passes from every start', () => {
  for (const s of codeSteps) {
    const code = solutions[s.id];
    assert.ok(code, `${s.id}: add a reference solution to tests/solutions.js`);
    for (const start of starts(s.field)) {
      const r = runProgram(code, s.field, start);
      assert.equal(r.error, null, `${s.id} ${JSON.stringify(start)}`);
      assert.equal(r.passed, true, `${s.id} ${JSON.stringify(start)}`);
    }
  }
  for (const id of Object.keys(solutions)) assert.ok(getStep(id), `solutions.js has "${id}" but no such step`);
});

test('the starter code does not already solve a programming step', () => {
  for (const s of codeSteps) {
    for (const start of starts(s.field)) assert.equal(runProgram(s.starter, s.field, start).passed, false, s.id);
  }
});

test('randomStart stays inside the declared ranges', () => {
  const field = { start: { x: 0, y: 0, h: 0 }, randomX: [10, 20], randomY: [30, 40], randomH: [90, 270] };
  for (const r of [0, 0.5, 0.999]) {
    const s = randomStart(field, () => r);
    assert.ok(s.x >= 10 && s.x <= 20 && s.y >= 30 && s.y <= 40 && [90, 270].includes(s.h));
  }
  assert.deepEqual(randomStart({ start: {} }), {});
});
