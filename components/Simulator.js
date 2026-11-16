'use client';
import { useEffect, useRef } from 'react';
import { FIELD, R, LIFT_MAX, initialFrame } from '../lib/sim';

const PX = 400; // canvas size
const s = PX / FIELD;
const Y = (y) => PX - y * s;
const NONE = []; // stable default so the draw effect does not restart on every render
const FLOOR = { red: '#e5484d', blue: '#3b82f6', yellow: '#f5c518', green: '#30a46c', white: '#f1f5f9', black: '#111827' };

const rect = (ctx, g, mode = 'fill') => ctx[`${mode}Rect`](g.x0 * s, Y(g.y1), (g.x1 - g.x0) * s, (g.y1 - g.y0) * s);
function dashed(ctx, g, colour, fill) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  rect(ctx, g);
  rect(ctx, g, 'stroke');
  ctx.setLineDash([]);
}
function label(ctx, text, x, y, colour = '#fff', size = 13) {
  ctx.fillStyle = colour;
  ctx.font = `700 ${size}px ui-monospace, Consolas, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// Fixed colours: the field is a grey foam-tile mat in both themes.
function draw(ctx, field, frames, upTo, tag) {
  ctx.clearRect(0, 0, PX, PX);
  ctx.fillStyle = '#3b4454';
  ctx.fillRect(0, 0, PX, PX);
  for (const z of field.zones ?? []) { ctx.fillStyle = FLOOR[z.color] ?? '#888'; ctx.globalAlpha = 0.8; rect(ctx, z); ctx.globalAlpha = 1; }
  ctx.strokeStyle = '#4d586b';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 80, 0); ctx.lineTo(i * 80, PX);
    ctx.moveTo(0, i * 80); ctx.lineTo(PX, i * 80);
    ctx.stroke();
  }
  if (field.goal) dashed(ctx, field.goal, '#4cc9f0', 'rgba(76,201,240,.35)');
  if (field.deliver) dashed(ctx, field.deliver, '#fbbf24', 'rgba(251,191,36,.3)');
  if (field.signal) {
    for (const [id, g] of Object.entries(field.signal.goals)) {
      dashed(ctx, g, '#4cc9f0', String(tag) === id ? 'rgba(76,201,240,.45)' : 'rgba(76,201,240,.12)');
      label(ctx, id, ((g.x0 + g.x1) / 2) * s, Y((g.y0 + g.y1) / 2));
    }
  }
  ctx.fillStyle = '#aab4c5';
  for (const o of field.obstacles ?? []) rect(ctx, o);
  const tags = [...(field.tags ?? [])];
  if (field.signal) tags.push({ id: tag ?? '?', x: field.signal.x, y: field.signal.y });
  for (const g of tags) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(g.x * s - 11, Y(g.y) - 11, 22, 22);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.strokeRect(g.x * s - 9.5, Y(g.y) - 9.5, 19, 19);
    label(ctx, String(g.id), g.x * s, Y(g.y) + 1, '#111827', 12);
  }

  // Trail of where the robot has been.
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= upTo; i++) ctx[i ? 'lineTo' : 'moveTo'](frames[i].x * s, Y(frames[i].y));
  ctx.stroke();

  const pose = frames[upTo];
  const cube = (x, y) => {
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 7, y - 7, 14, 14);
    ctx.strokeRect(x - 7, y - 7, 14, 14);
  };
  for (const o of pose.objs ?? []) if (!o.held) cube(o.x * s, Y(o.y));

  ctx.save();
  ctx.translate(pose.x * s, Y(pose.y));
  ctx.rotate((pose.h * Math.PI) / 180);
  ctx.fillStyle = '#ff8a3d';
  ctx.beginPath();
  ctx.arc(0, 0, R * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -R * s);
  ctx.stroke();
  if ((pose.objs ?? []).some((o) => o.held)) cube(0, -(R + 4) * s);
  ctx.restore();

  if (pose.lift > 0 || field.deliver?.height || field.endLift || field.noStrain) {
    ctx.fillStyle = 'rgba(11,17,28,.8)';
    ctx.fillRect(8, 8, 22, 96);
    ctx.fillStyle = '#2dd4bf';
    const hgt = (pose.lift / LIFT_MAX) * 88;
    ctx.fillRect(12, 100 - hgt, 14, hgt);
    label(ctx, `lift ${Math.round(pose.lift)} cm`, 78, 18, '#fff', 12);
  }
}

// Draws the field and plays `frames` (from the simulator). `children` are laid over the canvas (predict grid).
// `tag` is the signal tag shown in this run. With prefers-reduced-motion the result is shown at once.
export default function Simulator({ field, frames = NONE, tag, label: aria, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    const list = frames.length ? frames : [initialFrame(field)];
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const skip = Math.max(2, Math.ceil(list.length / 600)); // long runs play faster: at most about 10 seconds
    let i = still ? list.length - 1 : 0;
    let raf;
    const tick = () => {
      draw(ctx, field, list, Math.min(i, list.length - 1), tag);
      if (i < list.length - 1) {
        i += skip;
        raf = requestAnimationFrame(tick);
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [field, frames, tag]);

  return (
    <div className="field">
      <canvas ref={ref} width={PX} height={PX} role="img"
        aria-label={aria ?? 'Robot field. Orange robot with a white line at its front. Blue dashed goal zone. Grey obstacles.'} />
      {children}
    </div>
  );
}
