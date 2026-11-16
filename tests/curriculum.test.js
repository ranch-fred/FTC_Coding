// Checks every unit file: structure, ids, answers, and a passing reference solution per programming step.
import test from 'node:test';
import assert from 'node:assert/strict';
import { units, lessons, quizSteps, codeSteps, isCode, isQuiz, getStep, randomStart } from '../lib/curriculum/index.js';
import { runProgram, FIELD } from '../lib/sim.js';
import { grade, blankCount, CELL } from '../lib/grade.js';
import { solutions } from './solutions.js';

const TYPES = ['card', 'choice', 'order', 'blank', 'predict', 'match', 'fix', 'code'];
const PASS_KEYS = ['goal', 'signal', 'goalHeading', 'deliver', 'endLift', 'expectLogs', 'tests'];
const steps = lessons.flatMap((l) => l.steps);

// Every start a field can produce: each listed start, each end and the middle of its random ranges, each signal tag.
function starts(field) {
  const span = (r) => (r ? [r[0], Math.round((r[0] + r[1]) / 2), r[1]] : [undefined]);
  const out = [];
  for (const base of field.randomStarts ?? [{}])
    for (const x of span(field.randomX)) for (const y of span(field.randomY))
      for (const h of field.randomH ?? [undefined]) for (const tag of field.signal?.ids ?? [undefined]) {
        const s = { ...base };
        if (x !== undefined) s.x = x;
        if (y !== undefined) s.y = y;
        if (h !== undefined) s.h = h;
        if (tag !== undefined) s.tag = tag;
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
    assert.ok(u.lessons.length >= 5 && u.lessons.length <= 8, `unit ${u.id} needs 5 to 8 lessons, has ${u.lessons.length}`);
    const last = u.lessons.at(-1);
    assert.ok(last.boss && last.steps.some(isCode), `unit ${u.id} must end with a boss lesson that has a programming step`);
    assert.equal(u.lessons.filter((l) => l.boss).length, 1, `unit ${u.id} has one boss`);
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
    if (s.type === 'match') {
      assert.ok(s.pairs.length >= 2 && s.pairs.every((p) => p.length === 2 && p[0] && p[1]), `${s.id}: pairs`);
      assert.equal(new Set(s.pairs.map((p) => p[0])).size, s.pairs.length, `${s.id}: duplicate left items`);
    }
    if (isCode(s)) {
      assert.equal(typeof s.starter, 'string', `${s.id}: starter`);
      assert.ok(s.field && PASS_KEYS.some((k) => s.field[k]), `${s.id}: field needs something to check (${PASS_KEYS.join(', ')})`);
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
      : s.type === 'match' ? s.pairs.map((p) => p[1])
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
      const failed = r.checks.filter((c) => !c.ok).map((c) => c.label).join('; ');
      assert.equal(r.passed, true, `${s.id} ${JSON.stringify(start)} end ${JSON.stringify(r.end)} t=${r.time}: ${failed}`);
    }
  }
  for (const id of Object.keys(solutions)) assert.ok(getStep(id), `solutions.js has "${id}" but no such step`);
});

test('the starter code does not already solve a programming step', () => {
  for (const s of codeSteps) {
    for (const start of starts(s.field)) assert.equal(runProgram(s.starter, s.field, start).passed, false, s.id);
  }
});

test('the course covers 15 units and every step type', () => {
  assert.equal(units.length, 15);
  for (const t of TYPES) assert.ok(steps.some((s) => s.type === t), `no ${t} step in the course`);
});

test('randomStart stays inside the declared ranges', () => {
  const field = { start: { x: 0, y: 0, h: 0 }, randomX: [10, 20], randomY: [30, 40], randomH: [90, 270] };
  for (const r of [0, 0.5, 0.999]) {
    const s = randomStart(field, () => r);
    assert.ok(s.x >= 10 && s.x <= 20 && s.y >= 30 && s.y <= 40 && [90, 270].includes(s.h));
  }
  assert.deepEqual(randomStart({ start: {} }), {});
  const pick = randomStart({ randomStarts: [{ x: 1 }, { x: 2 }], signal: { ids: [4, 5] } }, () => 0.99);
  assert.deepEqual(pick, { x: 2, tag: 5 });
});
