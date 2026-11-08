import test from 'node:test';
import assert from 'node:assert/strict';
import { runProgram } from '../lib/sim.js';
import { getLesson, lessons } from '../lib/lessons.js';

const L = (id) => getLesson(id);

test('forward passes lesson 1, not passing without it', () => {
  assert.equal(runProgram('robot.forward(100);', L('drive-forward')).passed, true);
  assert.equal(runProgram('', L('drive-forward')).passed, false);
});

test('turn lesson solution', () => {
  assert.equal(runProgram('robot.forward(80);robot.turn(90);robot.forward(80);', L('turn')).passed, true);
});

test('box blocks straight path, detour passes', () => {
  const s = runProgram('robot.forward(150);', L('go-around'));
  assert.equal(s.passed, false);
  assert.equal(s.bumped, true);
  assert.equal(runProgram('robot.turn(90);robot.forward(50);robot.turn(-90);robot.forward(100);robot.turn(-90);robot.forward(50);robot.turn(90);robot.forward(50);', L('go-around')).passed, true);
});

test('sensor loop passes for any random start', () => {
  for (const y of [20, 45, 80]) {
    const r = runProgram('while (robot.distance() > 15) robot.forward(5);', L('sensor'), { y });
    assert.equal(r.passed, true, `y=${y}`);
  }
  assert.equal(runProgram('robot.forward(100);', L('sensor'), { y: 20 }).passed, false);
});

test('infinite movement loop and bad args are errors, not hangs', () => {
  assert.match(runProgram('while(true) robot.forward(1);', L('turn')).error, /Too many/);
  assert.match(runProgram('robot.forward("a")', L('turn')).error, /needs a number/);
  assert.match(runProgram('while(true){robot.turn(1)}', L('turn')).error, /Too many movement steps/);
});

test('every lesson has an unsolved start state', () => {
  for (const l of lessons) assert.equal(runProgram('', l).passed, false, l.id);
});

test('lesson 5 loop', () => {
  const code = 'for (let i=0;i<4;i++){robot.forward(40);robot.turn(90);robot.forward(40);robot.turn(-90);}';
  assert.equal(runProgram(code, L('loops')).passed, true);
});

test('lesson 6 maze', () => {
  const code = 'robot.turn(90);robot.forward(140);robot.turn(-90);robot.forward(80);robot.turn(-90);robot.forward(140);robot.turn(90);robot.forward(70);';
  assert.equal(runProgram(code, L('maze')).passed, true);
  assert.equal(runProgram('robot.forward(150);', L('maze')).passed, false);
});

test('lesson 7 sensor corner for any start', () => {
  const code = 'while(robot.distance()>20)robot.forward(5);robot.turn(90);while(robot.distance()>20)robot.forward(5);';
  for (const y of [20, 50, 80]) assert.equal(runProgram(code, L('two-walls'), { y }).passed, true, `y=${y}`);
});

test('lesson 8 heading for any start', () => {
  const code = 'robot.turn(-robot.pose().heading);robot.forward(70);';
  for (const h of [90, 180, 270]) assert.equal(runProgram(code, L('heading'), { h }).passed, true, `h=${h}`);
  assert.equal(runProgram('robot.forward(70);', L('heading'), { h: 90 }).passed, false);
});
