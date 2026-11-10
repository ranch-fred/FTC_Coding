import test from 'node:test';
import assert from 'node:assert/strict';
import { runProgram } from '../lib/sim.js';

const open = { start: { x: 100, y: 20, h: 0 }, obstacles: [], goal: { x0: 85, x1: 115, y0: 110, y1: 140 } };
const boxed = { start: { x: 100, y: 20, h: 0 }, obstacles: [{ x0: 70, x1: 130, y0: 80, y1: 110 }], goal: { x0: 85, x1: 115, y0: 160, y1: 185 } };

test('forward reaches the goal; doing nothing does not', () => {
  assert.equal(runProgram('robot.forward(100);', open).passed, true);
  assert.equal(runProgram('', open).passed, false);
});

test('turn is clockwise-positive and wraps to 0..359', () => {
  assert.equal(runProgram('robot.turn(90);', open).end.h, 90);
  assert.equal(runProgram('robot.turn(-90);', open).end.h, 270);
  const r = runProgram('robot.turn(90); robot.forward(50);', open);
  assert.ok(Math.abs(r.end.x - 150) < 1e-6 && Math.abs(r.end.y - 20) < 1e-6);
});

test('obstacles and walls block movement and set bumped', () => {
  const r = runProgram('robot.forward(150); robot.log(robot.bumped());', boxed);
  assert.equal(r.passed, false);
  assert.equal(r.bumped, true);
  assert.deepEqual(r.logs, ['true']);
  assert.ok(r.end.y < 80);
  assert.equal(runProgram('robot.backward(100);', open).bumped, true);
});

test('distance reads to the nearest thing ahead', () => {
  assert.deepEqual(runProgram('robot.log(robot.distance());', open).logs, ['172']);
  assert.deepEqual(runProgram('robot.log(robot.distance());', boxed).logs, ['52']);
});

test('start override and missing goal', () => {
  assert.equal(runProgram('robot.forward(10);', open, { y: 110 }).passed, true);
  const noGoal = runProgram('robot.forward(10);', { start: { x: 100, y: 20, h: 0 } });
  assert.equal(noGoal.passed, false);
  assert.equal(noGoal.end.y, 30);
});

test('infinite loops and bad arguments are errors, not hangs', () => {
  assert.match(runProgram('while(true) robot.forward(1);', open).error, /Too many/);
  assert.match(runProgram('robot.forward("a")', open).error, /needs a number/);
  assert.match(runProgram('while(true){robot.turn(1)}', open).error, /Too many movement steps/);
  assert.match(runProgram('this is not code', open).error, /./);
});
