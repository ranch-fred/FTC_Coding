import test from 'node:test';
import assert from 'node:assert/strict';
import { grade, cellOf, shuffled, fillBlanks, blankCount } from '../lib/grade.js';

test('choice: only the answer index is correct', () => {
  const step = { type: 'choice', options: ['a', 'b', 'c'], answer: 1 };
  assert.equal(grade(step, 1).correct, true);
  assert.equal(grade(step, 0).correct, false);
  assert.equal(grade(step, null).correct, false);
  assert.equal(grade(step, 0).expected, 'b');
});

test('order: needs every line in the right place; spacing does not matter', () => {
  const step = { type: 'order', lines: ['for (;;) {', '  go();', '}'] };
  assert.equal(grade(step, ['for (;;) {', 'go();', '}']).correct, true);
  assert.equal(grade(step, ['  go();', 'for (;;) {', '}']).correct, false);
  assert.equal(grade(step, ['for (;;) {', '  go();']).correct, false);
  assert.equal(grade(step, undefined).correct, false);
});

test('order: identical lines can be swapped', () => {
  const step = { type: 'order', lines: ['a();', 'b();', 'a();'] };
  assert.equal(grade(step, ['a();', 'b();', 'a();']).correct, true);
});

test('blank: accepts listed alternatives, ignores spaces and a trailing semicolon, keeps case', () => {
  const step = { type: 'blank', code: 'robot.___(___);', answers: ['forward', ['-h', '360 - h']] };
  assert.equal(blankCount(step), 2);
  assert.equal(grade(step, ['forward', '-h']).correct, true);
  assert.equal(grade(step, [' forward ', '360-h;']).correct, true);
  assert.equal(grade(step, ['Forward', '-h']).correct, false);
  assert.equal(grade(step, ['forward', 'h']).correct, false);
  assert.equal(grade(step, ['forward']).correct, false);
  assert.equal(grade(step, ['forward', '-h']).expected, 'robot.forward(-h);');
  assert.equal(fillBlanks(step, ['x']), 'robot.x(___);');
});

test('predict: the square containing the simulated end position is correct', () => {
  const step = { type: 'predict', code: 'robot.forward(80); robot.turn(90); robot.forward(40);', field: { start: { x: 20, y: 20, h: 0 } } };
  const r = grade(step, { col: 1, row: 2 }); // ends at (60, 100)
  assert.equal(r.correct, true);
  assert.deepEqual(r.cell, { col: 1, row: 2 });
  assert.ok(r.frames.length > 1);
  assert.equal(grade(step, { col: 0, row: 2 }).correct, false);
  assert.equal(grade(step, null).correct, false);
});

test('cellOf clamps to the field', () => {
  assert.deepEqual(cellOf({ x: 0, y: 0 }), { col: 0, row: 0 });
  assert.deepEqual(cellOf({ x: 200, y: 199.9 }), { col: 4, row: 4 });
});

test('programming steps are not graded here', () => {
  assert.throws(() => grade({ type: 'code' }, ''), /not auto-graded/);
});

test('shuffled is deterministic, keeps every item, and is never already in order', () => {
  const items = ['a', 'b', 'c', 'd'];
  for (const seed of ['x:0', 'x:1', 'y:0', 'turn/4:3', '']) {
    const out = shuffled(items, seed);
    assert.deepEqual([...out].sort(), items);
    assert.notDeepEqual(out, items);
    assert.deepEqual(shuffled(items, seed), out);
  }
  assert.deepEqual(shuffled(['only'], 's'), ['only']);
});
