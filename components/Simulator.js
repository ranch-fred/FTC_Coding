'use client';
import { useEffect, useRef } from 'react';
import { FIELD, R } from '../lib/sim';

const PX = 400; // canvas size
const s = PX / FIELD;
const Y = (y) => PX - y * s;
const NONE = []; // stable default so the draw effect does not restart on every render

// Fixed colours: the field is a grey foam-tile mat in both themes.
function draw(ctx, field, frames, upTo) {
  ctx.clearRect(0, 0, PX, PX);
  ctx.fillStyle = '#3b4454';
  ctx.fillRect(0, 0, PX, PX);
  ctx.strokeStyle = '#4d586b';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 80, 0); ctx.lineTo(i * 80, PX);
    ctx.moveTo(0, i * 80); ctx.lineTo(PX, i * 80);
    ctx.stroke();
  }
  const g = field.goal;
  if (g) {
    ctx.fillStyle = 'rgba(76,201,240,.35)';
    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.fillRect(g.x0 * s, Y(g.y1), (g.x1 - g.x0) * s, (g.y1 - g.y0) * s);
    ctx.strokeRect(g.x0 * s, Y(g.y1), (g.x1 - g.x0) * s, (g.y1 - g.y0) * s);
    ctx.setLineDash([]);
  }
  ctx.fillStyle = '#aab4c5';
  for (const o of field.obstacles ?? []) ctx.fillRect(o.x0 * s, Y(o.y1), (o.x1 - o.x0) * s, (o.y1 - o.y0) * s);

  // Trail of where the robot has been.
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= upTo; i++) ctx[i ? 'lineTo' : 'moveTo'](frames[i].x * s, Y(frames[i].y));
  ctx.stroke();

  const pose = frames[upTo];
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
  ctx.restore();
}

// Draws the field and plays `frames` (from the simulator). `children` are laid over the canvas (predict grid).
// With prefers-reduced-motion the result is shown at once: trail plus final position.
export default function Simulator({ field, frames = NONE, label, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    const list = frames.length ? frames : [{ ...field.start }];
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = still ? list.length - 1 : 0;
    let raf;
    const tick = () => {
      draw(ctx, field, list, Math.min(i, list.length - 1));
      if (i < list.length - 1) {
        i += 2;
        raf = requestAnimationFrame(tick);
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [field, frames]);

  return (
    <div className="field">
      <canvas ref={ref} width={PX} height={PX} role="img"
        aria-label={label ?? 'Robot field. Orange robot with a white line at its front. Blue dashed goal zone. Grey obstacles.'} />
      {children}
    </div>
  );
}
