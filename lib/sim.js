// Deterministic robot simulator. Field is 200x200 cm, x right, y up, heading 0 = +y, clockwise positive.
// User code runs synchronously; every move/turn records frames that the UI plays back.
export const FIELD = 200;
export const R = 8; // robot radius, cm
export const MAX_FRAMES = 6000;

const rad = (d) => (d * Math.PI) / 180;

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

export function runProgram(code, lesson, startOverride = {}) {
  let { x, y, h } = { ...lesson.start, ...startOverride };
  const obstacles = lesson.obstacles;
  const frames = [{ x, y, h }];
  const logs = [];
  let bumped = false;

  const blocked = (px, py) =>
    px - R < 0 || px + R > FIELD || py - R < 0 || py + R > FIELD || obstacles.some((o) => circleHitsRect(px, py, o));
  let calls = 0;
  const tick = () => {
    if (++calls > 50000) throw new Error('Too many robot commands. Is there an infinite loop?');
  };
  const push = () => {
    if (frames.length >= MAX_FRAMES) throw new Error('Too many movement steps. Is there an infinite loop?');
    frames.push({ x, y, h });
  };

  const robot = {
    forward(cm) { move(num(cm, 'forward(cm)')); },
    backward(cm) { move(-num(cm, 'backward(cm)')); },
    turn(deg) { // positive = clockwise
      tick();
      deg = num(deg, 'turn(degrees)');
      const dir = Math.sign(deg);
      for (let left = Math.abs(deg); left > 0; ) {
        const step = Math.min(3, left);
        h = (((h + dir * step) % 360) + 360) % 360;
        left -= step;
        push();
      }
    },
    distance() { // cm from robot edge to the nearest wall/obstacle straight ahead
      tick();
      const dx = Math.sin(rad(h));
      const dy = Math.cos(rad(h));
      let t = Infinity;
      if (dx > 1e-9) t = Math.min(t, (FIELD - x) / dx);
      if (dx < -1e-9) t = Math.min(t, -x / dx);
      if (dy > 1e-9) t = Math.min(t, (FIELD - y) / dy);
      if (dy < -1e-9) t = Math.min(t, -y / dy);
      for (const o of obstacles) t = Math.min(t, rayRect(x, y, dx, dy, o));
      return Math.round(Math.max(0, t - R) * 10) / 10;
    },
    bumped() { return bumped; },
    pose() { return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, heading: Math.round(h) }; },
    log(...a) { logs.push(a.map(String).join(' ')); },
  };

  function move(cm) {
    tick();
    const dir = Math.sign(cm);
    for (let left = Math.abs(cm); left > 0; ) {
      const step = Math.min(1, left);
      const nx = x + dir * step * Math.sin(rad(h));
      const ny = y + dir * step * Math.cos(rad(h));
      if (blocked(nx, ny)) { bumped = true; return; }
      x = nx; y = ny; left -= step;
      push();
    }
  }

  let error = null;
  try {
    new Function('robot', `"use strict";\n${code}`)(robot);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const g = lesson.goal;
  const passed = !error && x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1;
  return { frames, logs, error, passed, bumped };
}
