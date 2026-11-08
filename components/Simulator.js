'use client';
import { useEffect, useRef } from 'react';
import { FIELD, R } from '../lib/sim';

const PX = 400; // canvas size
const s = PX / FIELD;

function draw(ctx, lesson, pose) {
  const Y = (y) => PX - y * s;
  ctx.clearRect(0, 0, PX, PX);
  ctx.fillStyle = '#f4f6f8';
  ctx.fillRect(0, 0, PX, PX);
  const g = lesson.goal;
  ctx.fillStyle = 'rgba(34,170,90,.35)';
  ctx.fillRect(g.x0 * s, Y(g.y1), (g.x1 - g.x0) * s, (g.y1 - g.y0) * s);
  ctx.fillStyle = '#556';
  for (const o of lesson.obstacles) ctx.fillRect(o.x0 * s, Y(o.y1), (o.x1 - o.x0) * s, (o.y1 - o.y0) * s);
  ctx.save();
  ctx.translate(pose.x * s, Y(pose.y));
  ctx.rotate((pose.h * Math.PI) / 180);
  ctx.fillStyle = '#e8590c';
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

// `frames` changes on each run; plays them back ~2 per animation tick.
export default function Simulator({ lesson, frames }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    const list = frames.length ? frames : [{ ...lesson.start }];
    let i = 0;
    let raf;
    const tick = () => {
      draw(ctx, lesson, list[Math.min(i, list.length - 1)]);
      i += 2;
      if (i - 2 < list.length - 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [lesson, frames]);

  return <canvas ref={ref} width={PX} height={PX} role="img" aria-label="Robot field. Orange robot, green goal zone." />;
}
