// The extended robot: power and time, sensors, mechanisms, TeleOp, vision, and the pass checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runProgram } from '../lib/sim.js';

const base = { start: { x: 100, y: 20, h: 0 } };
const all = { x0: 0, x1: 200, y0: 0, y1: 200 };
const near = (a, b, tol = 0.6) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);
const check = (r, text) => r.checks.find((c) => c.label.includes(text));

test('motor power and time: distance = power x 50 cm/s x seconds', () => {
  const r = runProgram('robot.setPower(0.5, 0.5); robot.wait(2); robot.stop(); robot.log(robot.time());', base);
  near(r.end.y, 70);
  assert.deepEqual(r.logs, ['2']);
  near(runProgram('robot.drive(1, 1, 1);', base).end.y, 70);
  near(runProgram('robot.drive(-1, -1, 1);', { start: { x: 100, y: 100, h: 0 } }).end.y, 50);
  near(runProgram('robot.setPower(9, 9); robot.wait(1);', base).end.y, 70); // power is clamped to 1
});

test('opposite powers spin on the spot; unequal powers curve toward the slower side', () => {
  const spin = runProgram('robot.drive(0.5, -0.5, 0.5);', base);
  near(spin.end.h, 89.5, 1);
  near(spin.end.y, 20, 0.01);
  const arc = runProgram('robot.drive(1, 0.5, 1);', base);
  assert.ok(arc.end.x > 105 && arc.end.h > 10 && arc.end.h < 180, 'curves right');
});

test('drift makes one side weaker; inertia makes the robot coast after the program ends', () => {
  const drift = runProgram('robot.drive(1, 1, 2);', { ...base, drift: { right: 0.1 } });
  assert.ok(drift.end.x > 105, 'weaker right side curves right');
  const coast = runProgram('robot.setPower(1, 1); robot.wait(2); robot.stop();', { ...base, inertia: 0.4 });
  const ideal = runProgram('robot.setPower(1, 1); robot.wait(2); robot.stop();', base);
  near(ideal.end.y, 120);
  assert.ok(coast.end.y > 20 + 60, 'slow to start, but it moved');
  const stopped = runProgram('robot.setPower(1, 1); robot.wait(2); robot.stop(); robot.wait(0.02);', { ...base, inertia: 0.4 });
  assert.ok(coast.end.y > stopped.frames[100].y + 10, 'keeps rolling after stop()');
});

test('time: moves cost time and a time limit freezes the robot', () => {
  assert.deepEqual(runProgram('robot.forward(100); robot.turn(90); robot.log(robot.time());', base).logs, ['2.5']);
  const late = runProgram('robot.forward(100); robot.forward(50);', { ...base, goal: all, timeLimit: 2 });
  near(late.end.y, 120, 1.1);
  assert.equal(late.passed, false);
  assert.equal(check(late, 'Finished within').ok, false);
  assert.equal(runProgram('robot.forward(90);', { ...base, goal: all, timeLimit: 2 }).passed, true);
  assert.match(runProgram('while (true) robot.wait(1);', base).error, /simulated seconds/);
});

test('encoders count 10 ticks per cm and reset', () => {
  assert.deepEqual(runProgram('robot.forward(50); const e = robot.encoders(); robot.log(e.left, e.right);', base).logs, ['500 500']);
  assert.deepEqual(runProgram('robot.forward(50); robot.resetEncoders(); robot.forward(5); robot.log(robot.encoders().left);', base).logs, ['50']);
  const turn = runProgram('robot.turn(90); const e = robot.encoders(); robot.log(e.left > 0, e.right < 0);', base);
  assert.deepEqual(turn.logs, ['true true']);
});

test('gyro, colour and touch sensors', () => {
  assert.deepEqual(runProgram('robot.turn(-90); robot.log(robot.heading());', base).logs, ['270']);
  const zones = [{ x0: 0, x1: 200, y0: 90, y1: 110, color: 'red' }];
  assert.deepEqual(runProgram('robot.log(robot.color()); robot.forward(80); robot.log(robot.color());', { ...base, zones }).logs, ['gray', 'red']);
  assert.deepEqual(runProgram('robot.log(robot.touch()); robot.forward(200); robot.log(robot.touch());', base).logs, ['false', 'true']);
});

test('mecanum strafes without turning', () => {
  const r = runProgram('robot.setMecanum(0, 1, 0); robot.wait(1); robot.stop();', { start: { x: 60, y: 100, h: 0 } });
  near(r.end.x, 110);
  near(r.end.y, 100, 0.01);
  assert.equal(r.end.h, 0);
  near(runProgram('robot.setMecanum(1, 0, 0); robot.wait(1);', { start: { x: 60, y: 100, h: 90 } }).end.x, 110);
});

test('claw grabs only in reach with the lift down, and scores in the zone', () => {
  const field = { ...base, objects: [{ x: 100, y: 80 }], deliver: { x0: 80, x1: 120, y0: 150, y1: 190 } };
  assert.equal(runProgram('robot.forward(48); robot.claw(1); robot.forward(90); robot.claw(0);', field).passed, true);
  assert.equal(runProgram('robot.claw(1); robot.forward(138); robot.claw(0);', field).passed, false, 'too far to grab');
  assert.equal(runProgram('robot.forward(48); robot.liftTo(30); robot.claw(1); robot.forward(90); robot.claw(0);', field).passed, false, 'lift is up');
  assert.equal(runProgram('robot.forward(48); robot.claw(1); robot.forward(90);', field).passed, false, 'still holding');
  const high = { ...field, deliver: { ...field.deliver, height: 40 } };
  assert.equal(runProgram('robot.forward(48); robot.claw(1); robot.forward(90); robot.claw(0);', high).passed, false, 'released too low');
  assert.equal(runProgram('robot.forward(48); robot.claw(1); robot.liftTo(45); robot.forward(90); robot.claw(0);', high).passed, true);
  const lying = { ...base, objects: [{ x: 100, y: 170 }], deliver: field.deliver };
  assert.equal(runProgram('', lying).passed, false, 'an object lying in the zone from the start does not count');
});

test('intake collects on contact and ejects', () => {
  const field = { ...base, objects: [{ x: 100, y: 100 }], deliver: { x0: 80, x1: 120, y0: 150, y1: 190 } };
  assert.equal(runProgram('robot.intake(1); robot.forward(140); robot.intake(-1);', field).passed, true);
  assert.equal(runProgram('robot.forward(140); robot.intake(-1);', field).passed, false);
});

test('lift: speed, limits, strain, limit switch and starting height', () => {
  const f = { start: { x: 100, y: 100, h: 0 }, endLift: [29, 31], noStrain: true };
  assert.equal(runProgram('robot.liftPower(1); robot.wait(1); robot.liftPower(0);', f).passed, true);
  assert.deepEqual(runProgram('robot.liftTo(99); robot.log(robot.liftHeight());', f).logs, ['60']);
  const slam = runProgram('robot.liftPower(1); robot.wait(3); robot.liftPower(0);', { ...f, endLift: [50, 60] });
  assert.equal(check(slam, 'never pushes').ok, false);
  const home = 'robot.liftPower(-0.5); while (!robot.liftAtBottom()) robot.wait(0.02); robot.liftPower(0);';
  const homed = runProgram(home, { ...f, endLift: [0, 0] }, { lift: 45 });
  assert.equal(homed.frames[0].lift, 45);
  assert.equal(homed.passed, true);
});

test('TeleOp: loop(gamepad) runs through the driver script', () => {
  const field = { ...base, script: [{ for: 2, left_stick_y: -1, right_stick_y: -1 }, { for: 1 }], goal: { x0: 85, x1: 115, y0: 105, y1: 135 } };
  const r = runProgram('function loop(gamepad) { robot.setPower(-gamepad.left_stick_y, -gamepad.right_stick_y); }', field);
  near(r.end.y, 120);
  assert.equal(r.passed, true);
  assert.equal(r.time, 3);
  assert.match(runProgram('robot.forward(10);', field).error, /function named loop/);
  const pad = runProgram('let seen = ""; function loop(g) { seen = g.a + " " + g.left_trigger + " " + g.right_stick_x; }',
    { ...base, script: [{ for: 0.1, a: true }], tests: [{ call: 'seen', equals: 'true 0 0' }] });
  assert.equal(pad.passed, true);
});

test('vision: detect gives id, bearing and range, or null when out of view', () => {
  const field = { start: { x: 100, y: 60, h: 0 }, tags: [{ id: 7, x: 100, y: 180 }] };
  assert.deepEqual(runProgram('const t = robot.detect(); robot.log(t.id, t.bearing, t.range);', field).logs, ['7 0 112']);
  assert.deepEqual(runProgram('robot.turn(20); robot.log(robot.detect().bearing);', field).logs, ['-20']);
  assert.deepEqual(runProgram('robot.turn(90); robot.log(robot.detect());', field).logs, ['null']);
});

test('signal tag: the run reports the tag and checks the matching zone', () => {
  const z = (x0) => ({ x0, x1: x0 + 40, y0: 120, y1: 160 });
  const field = { start: { x: 100, y: 30, h: 0 }, signal: { x: 100, y: 190, ids: [1, 2, 3], goals: { 1: z(20), 2: z(80), 3: z(140) } } };
  const code = 'const id = robot.detect().id; robot.forward(110); if (id === 1) { robot.turn(-90); robot.forward(60); } if (id === 3) { robot.turn(90); robot.forward(60); }';
  for (const tag of [1, 2, 3]) {
    const r = runProgram(code, field, { tag });
    assert.equal(r.tag, tag);
    assert.equal(r.passed, true, `tag ${tag}`);
  }
  assert.equal(runProgram('robot.forward(110);', field, { tag: 3 }).passed, false);
});

test('checks: output, function tests, heading, no-bump; nothing to check never passes', () => {
  assert.equal(runProgram('robot.log("a"); telemetry.addData("b", 2);', { expectLogs: ['a', 'b: 2'] }).passed, true);
  assert.equal(runProgram('robot.log("a");', { expectLogs: ['a', 'b'] }).passed, false);
  const tests = [{ call: 'twice(4)', equals: 8 }, { call: 'LIMIT', equals: 55 }];
  assert.equal(runProgram('const LIMIT = 55; function twice(n) { return n * 2; }', { tests }).passed, true);
  const bad = runProgram('function twice(n) { return n; }', { tests });
  assert.equal(bad.passed, false);
  assert.match(bad.checks[0].label, /got 4/);
  assert.match(bad.checks[1].label, /error/);
  assert.equal(runProgram('robot.turn(88);', { ...base, goalHeading: [90, 3] }).passed, true);
  assert.equal(runProgram('robot.turn(80);', { ...base, goalHeading: [90, 3] }).passed, false);
  assert.equal(runProgram('robot.forward(500);', { ...base, goal: all, noBump: true }).passed, false);
  assert.equal(runProgram('robot.forward(10);', base).passed, false);
  assert.deepEqual(runProgram('oops(', { ...base, goal: all }).checks, []);
});
