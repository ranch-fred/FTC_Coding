// Deterministic robot simulator. Field is 200x200 cm, x right, y up, heading 0 = +y, clockwise positive.
// User code runs synchronously; every move records frames that the UI plays back.
// A "field" object describes one challenge: where things are and what counts as passing. See README.
export const FIELD = 200;
export const R = 8; // robot radius, cm
export const MAX_FRAMES = 8000;
export const SPEED = 50; // cm per second at full power
export const TURN_RATE = 180; // degrees per second for turn() and full mecanum turn
export const TRACK = 16; // cm between the left and right wheels
export const TICKS_PER_CM = 10; // encoder ticks per cm of wheel travel
export const LIFT_MAX = 60; // cm
export const LIFT_SPEED = 30; // cm per second at full power
export const MAX_TIME = 120; // simulated seconds before a program is stopped
const DT = 0.02; // physics step, seconds
const TELEOP_TICK = 0.05; // how often loop(gamepad) is called
const GRAB_REACH = 10; // cm from the front of the robot
const VIEW = 35; // camera sees this many degrees to each side

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const wrap = (h) => ((h % 360) + 360) % 360;
const wrap180 = (a) => wrap(a + 180) - 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;
const inRect = (p, g) => p.x >= g.x0 && p.x <= g.x1 && p.y >= g.y0 && p.y <= g.y1;

function circleHitsRect(px, py, o) {
  const cx = Math.max(o.x0, Math.min(px, o.x1));
  const cy = Math.max(o.y0, Math.min(py, o.y1));
  return (px - cx) ** 2 + (py - cy) ** 2 < R * R;
}

function rayRect(x, y, dx, dy, o) {
  let tmin = 0;
  let tmax = Infinity;
  for (const [p, d, lo, hi] of [[x, dx, o.x0, o.x1], [y, dy, o.y0, o.y1]]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return Infinity;
    } else {
      const a = (lo - p) / d;
      const b = (hi - p) / d;
      tmin = Math.max(tmin, Math.min(a, b));
      tmax = Math.min(tmax, Math.max(a, b));
    }
  }
  return tmin <= tmax ? tmin : Infinity;
}

function num(v, name) {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`${name} needs a number, got ${String(v)}`);
  return v;
}

const GAMEPAD = {
  left_stick_x: 0, left_stick_y: 0, right_stick_x: 0, right_stick_y: 0, left_trigger: 0, right_trigger: 0,
  a: false, b: false, x: false, y: false, left_bumper: false, right_bumper: false, dpad_up: false, dpad_down: false,
};

// What the field looks like before any code runs.
export function initialFrame(field = {}, startOverride = {}) {
  const { tag, ...over } = startOverride; // tag picks the signal tag, the rest overrides the start
  return {
    x: 100, y: 100, h: 0, lift: field.lift ?? 0, ...field.start, ...over,
    objs: (field.objects ?? []).map((o) => ({ x: o.x, y: o.y, held: false, drop: 0, moved: false })),
  };
}

// Returns { frames, logs, error, passed, checks, bumped, end, time, tag }.
// `passed` is true when there is no error and every check the field asks for is met.
export function runProgram(code, field = {}, startOverride = {}) {
  const first = initialFrame(field, startOverride);
  let { x, y, h, lift, objs } = first;
  const obstacles = field.obstacles ?? [];
  const zones = field.zones ?? [];
  const tags = [...(field.tags ?? [])];
  const tag = field.signal ? startOverride.tag ?? field.signal.ids[0] : null; // which signal tag is showing this run
  if (field.signal) tags.push({ id: tag, x: field.signal.x, y: field.signal.y });
  const limit = field.timeLimit ?? Infinity;

  const frames = [{ x, y, h, lift, objs }];
  const logs = [];
  let t = 0;
  let bumped = false;
  let timedOut = false;
  let strained = false;
  let strain = 0;
  let power = { l: 0, r: 0 }; // tank drive command
  let mec = null; // mecanum command { f, s, t } when in use
  let vl = 0; // actual wheel speeds, cm/s
  let vr = 0;
  let encL = 0; // wheel travel, cm
  let encR = 0;
  let liftP = 0;
  let intake = 0;

  const blocked = (px, py) =>
    px - R < 0 || px + R > FIELD || py - R < 0 || py + R > FIELD || obstacles.some((o) => circleHitsRect(px, py, o));
  let calls = 0;
  const tick = () => {
    if (++calls > 50000) throw new Error('Too many robot commands. Is there an infinite loop?');
  };
  const push = () => {
    if (frames.length >= MAX_FRAMES) throw new Error('Too many movement steps. Is there an infinite loop?');
    frames.push({ x, y, h, lift, objs });
  };
  const front = (d = R + 4) => ({ x: x + d * Math.sin(rad(h)), y: y + d * Math.cos(rad(h)) });
  const holding = () => objs.some((o) => o.held);

  function pickUp(reachFrom, reach) {
    if (holding()) return;
    let best = -1;
    let bestD = reach;
    objs.forEach((o, i) => {
      const d = Math.hypot(o.x - reachFrom.x, o.y - reachFrom.y);
      if (d <= bestD) { best = i; bestD = d; }
    });
    if (best >= 0) objs = objs.map((o, i) => (i === best ? { ...o, held: true, moved: true } : o));
  }
  function letGo() {
    if (!holding()) return;
    const p = front();
    objs = objs.map((o) => (o.held ? { ...o, held: false, x: p.x, y: p.y, drop: lift } : o));
  }

  // Lets `dt` seconds pass. Returns false once the autonomous time limit is over: nothing moves after that.
  function passTime(dt) {
    t += dt;
    if (t > MAX_TIME) throw new Error(`Program ran for more than ${MAX_TIME} simulated seconds. Is a loop missing its exit?`);
    if (t > limit + 1e-9) { timedOut = true; return false; }
    if (liftP) {
      const want = lift + liftP * LIFT_SPEED * dt;
      if (want < 0 || want > LIFT_MAX) {
        strain += dt;
        if (strain > 0.25) strained = true; // motor kept pushing against the end of the lift
      }
      lift = clamp(want, 0, LIFT_MAX);
    }
    return true;
  }

  function shift(dx, dy) {
    if (blocked(x + dx, y + dy)) { bumped = true; vl = 0; vr = 0; return false; }
    x += dx; y += dy;
    if (intake > 0) pickUp({ x, y }, R + 6);
    return true;
  }

  // One physics step with the motors as currently commanded.
  function step(dt) {
    if (!passTime(dt)) return;
    let moved = liftP !== 0;
    if (mec) {
      if (mec.f || mec.s || mec.t) {
        h = wrap(h + mec.t * TURN_RATE * dt);
        const s = Math.sin(rad(h));
        const c = Math.cos(rad(h));
        shift((mec.f * s + mec.s * c) * SPEED * dt, (mec.f * c - mec.s * s) * SPEED * dt);
        encL += mec.f * SPEED * dt; encR += mec.f * SPEED * dt;
        moved = true;
      }
    } else {
      const tl = power.l * SPEED * (1 - (field.drift?.left ?? 0));
      const tr = power.r * SPEED * (1 - (field.drift?.right ?? 0));
      if (field.inertia) {
        const k = Math.min(1, dt / field.inertia); // motors take time to change speed
        vl += (tl - vl) * k; vr += (tr - vr) * k;
      } else { vl = tl; vr = tr; }
      if (Math.abs(vl) > 0.01 || Math.abs(vr) > 0.01) {
        const v = (vl + vr) / 2;
        h = wrap(h + deg(((vl - vr) / TRACK) * dt));
        if (shift(v * dt * Math.sin(rad(h)), v * dt * Math.cos(rad(h)))) { encL += vl * dt; encR += vr * dt; }
        moved = true;
      }
    }
    if (moved) push();
  }

  function wait(seconds) {
    const n = Math.max(1, Math.ceil(seconds / DT));
    for (let i = 0; i < n; i++) step(seconds / n);
  }

  function move(cm) {
    tick();
    const dir = Math.sign(cm);
    for (let left = Math.abs(cm); left > 0; ) {
      const d = Math.min(1, left);
      if (!passTime(d / SPEED)) return;
      if (!shift(dir * d * Math.sin(rad(h)), dir * d * Math.cos(rad(h)))) return;
      encL += dir * d; encR += dir * d; left -= d;
      push();
    }
  }

  const robot = {
    // --- driving by distance ---
    forward(cm) { move(num(cm, 'forward(cm)')); },
    backward(cm) { move(-num(cm, 'backward(cm)')); },
    turn(degrees) { // positive = clockwise
      tick();
      degrees = num(degrees, 'turn(degrees)');
      const dir = Math.sign(degrees);
      for (let left = Math.abs(degrees); left > 0; ) {
        const d = Math.min(3, left);
        if (!passTime(d / TURN_RATE)) return;
        h = wrap(h + dir * d);
        const arc = rad(d) * (TRACK / 2);
        encL += dir * arc; encR -= dir * arc; left -= d;
        push();
      }
    },
    // --- driving by motor power and time ---
    setPower(left, right) { tick(); mec = null; power = { l: clamp(num(left, 'setPower(left, right)'), -1, 1), r: clamp(num(right, 'setPower(left, right)'), -1, 1) }; },
    setMecanum(forward, strafe, turn) {
      tick();
      mec = { f: clamp(num(forward, 'setMecanum(forward, strafe, turn)'), -1, 1), s: clamp(num(strafe, 'setMecanum(forward, strafe, turn)'), -1, 1), t: clamp(num(turn, 'setMecanum(forward, strafe, turn)'), -1, 1) };
    },
    stop() { tick(); power = { l: 0, r: 0 }; if (mec) mec = { f: 0, s: 0, t: 0 }; },
    wait(seconds) { tick(); wait(Math.max(0, num(seconds, 'wait(seconds)'))); },
    drive(left, right, seconds) { robot.setPower(left, right); robot.wait(seconds); robot.stop(); },
    time() { return round1(t); },
    // --- sensors ---
    distance() { // cm from robot edge to the nearest wall/obstacle straight ahead
      tick();
      const dx = Math.sin(rad(h));
      const dy = Math.cos(rad(h));
      let d = Infinity;
      if (dx > 1e-9) d = Math.min(d, (FIELD - x) / dx);
      if (dx < -1e-9) d = Math.min(d, -x / dx);
      if (dy > 1e-9) d = Math.min(d, (FIELD - y) / dy);
      if (dy < -1e-9) d = Math.min(d, -y / dy);
      for (const o of obstacles) d = Math.min(d, rayRect(x, y, dx, dy, o));
      return round1(Math.max(0, d - R));
    },
    touch() { return robot.distance() <= 1; }, // touch sensor on the front bumper
    bumped() { return bumped; },
    color() { tick(); return zones.find((z) => inRect({ x, y }, z))?.color ?? 'gray'; }, // floor colour under the robot
    heading() { tick(); return round1(wrap(round1(h))); }, // gyro, 0..359.9
    pose() { return { x: round1(x), y: round1(y), heading: wrap(Math.round(h)) }; },
    encoders() { tick(); return { left: Math.round(encL * TICKS_PER_CM), right: Math.round(encR * TICKS_PER_CM) }; },
    resetEncoders() { tick(); encL = 0; encR = 0; },
    detect() { // camera: nearest tag in view as { id, bearing, range } or null. bearing > 0 means the tag is to the right.
      tick();
      let seen = null;
      for (const g of tags) {
        const range = Math.hypot(g.x - x, g.y - y) - R;
        const bearing = wrap180(deg(Math.atan2(g.x - x, g.y - y)) - h);
        if (Math.abs(bearing) <= VIEW && (!seen || range < seen.range)) seen = { id: g.id, bearing: round1(bearing), range: round1(range) };
      }
      return seen;
    },
    // --- mechanisms ---
    liftPower(p) { tick(); liftP = clamp(num(p, 'liftPower(power)'), -1, 1); },
    liftTo(cm) { // run-to-position: moves to the height and stops by itself
      tick();
      const target = clamp(num(cm, 'liftTo(cm)'), 0, LIFT_MAX);
      const keep = liftP;
      liftP = 0;
      if (passTime(Math.abs(target - lift) / LIFT_SPEED)) { lift = target; push(); }
      liftP = keep;
    },
    liftHeight() { tick(); return round1(lift); },
    liftAtBottom() { tick(); return lift <= 0; }, // limit switch
    claw(position) { // servo: 0 = open, 1 = closed
      tick();
      const p = clamp(num(position, 'claw(position)'), 0, 1);
      if (!passTime(0.3)) return;
      if (p >= 0.6 && lift <= 10) pickUp(front(), GRAB_REACH);
      if (p <= 0.4) letGo();
      push();
    },
    intake(p) { tick(); intake = clamp(num(p, 'intake(power)'), -1, 1); if (intake > 0) pickUp({ x, y }, R + 6); if (intake < 0) letGo(); push(); },
    log(...a) { logs.push(a.map(String).join(' ')); },
  };
  const telemetry = {
    addData(caption, value) { logs.push(`${caption}: ${String(value)}`); },
    addLine(text) { logs.push(String(text)); },
    update() {},
  };

  let error = null;
  let probe = null;
  try {
    // The trailing return exposes loop() for TeleOp and lets the tests call the student's functions.
    const out = new Function('robot', 'telemetry', `"use strict";\n${code}\n;return { loop: typeof loop === 'function' ? loop : null, probe: (__src) => eval(__src) };`)(robot, telemetry);
    probe = out?.probe ?? null;
    if (field.script) {
      if (!out?.loop) throw new Error('TeleOp code needs a function named loop: function loop(gamepad) { ... }');
      for (const { for: seconds, ...sticks } of field.script) {
        const pad = { ...GAMEPAD, ...sticks };
        for (let i = 0; i < Math.round(seconds / TELEOP_TICK); i++) {
          out.loop({ ...pad });
          wait(TELEOP_TICK);
        }
      }
    }
    // The program is over: motors are switched off, and a robot with inertia rolls to a stop.
    power = { l: 0, r: 0 };
    mec = null;
    liftP = 0;
    for (let i = 0; field.inertia && i < 200 && (Math.abs(vl) > 0.5 || Math.abs(vr) > 0.5); i++) step(DT);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const checks = [];
  if (!error) {
    if (field.goal) checks.push({ label: 'Robot stops in the goal zone', ok: inRect({ x, y }, field.goal) });
    if (field.signal) checks.push({ label: `Robot stops in the zone for tag ${tag}`, ok: inRect({ x, y }, field.signal.goals[tag]) });
    if (field.goalHeading) {
      const [target, tol] = field.goalHeading;
      checks.push({ label: `Robot faces ${target}° (within ${tol}°)`, ok: Math.abs(wrap180(h - target)) <= tol });
    }
    if (field.deliver) {
      const d = field.deliver;
      const scored = objs.filter((o) => o.moved && !o.held && inRect(o, d) && o.drop >= (d.height ?? 0)).length;
      const need = d.count ?? 1;
      checks.push({ label: `${need} object${need === 1 ? '' : 's'} scored${d.height ? ` with the lift at ${d.height} cm or higher` : ''} (now ${scored})`, ok: scored >= need });
    }
    if (field.endLift) checks.push({ label: `Lift ends between ${field.endLift[0]} and ${field.endLift[1]} cm (now ${round1(lift)})`, ok: lift >= field.endLift[0] && lift <= field.endLift[1] });
    if (field.expectLogs) {
      const want = field.expectLogs.map(String);
      checks.push({ label: 'Output matches the expected output', ok: logs.length === want.length && want.every((w, i) => w.trim() === logs[i].trim()) });
    }
    for (const { call, equals } of field.tests ?? []) {
      let got;
      let ok = false;
      try { got = JSON.stringify(probe(call)); ok = got === JSON.stringify(equals); } catch (e) { got = `error: ${e.message}`; }
      checks.push({ label: `${call} gives ${JSON.stringify(equals)}${ok ? '' : ` (got ${got})`}`, ok });
    }
    if (field.noBump) checks.push({ label: 'No collisions', ok: !bumped });
    if (field.noStrain) checks.push({ label: 'Lift motor never pushes against its limit', ok: !strained });
    if (field.timeLimit) checks.push({ label: `Finished within ${field.timeLimit} seconds`, ok: !timedOut });
  }
  const passed = !error && checks.length > 0 && checks.every((c) => c.ok);
  return { frames, logs, error, passed, checks, bumped, end: { x, y, h }, time: round1(t), tag };
}
