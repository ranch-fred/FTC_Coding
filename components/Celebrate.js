'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Icon from './Icon';

const SPARKS = [0, 45, 90, 135, 180, 225, 270, 315];

// End-of-session screen. tiles = [[label, value]], banners = [[icon, text]] for level-up and unit-complete.
// The spark animation is switched off by prefers-reduced-motion in globals.css.
export default function Celebrate({ title, gold, tiles, banners = [], children }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return (
    <section className="celebrate">
      <div className={`medal${gold ? ' gold' : ''}`} aria-hidden="true">
        <Icon name={gold ? 'star' : 'check'} />
        {SPARKS.map((a) => <b key={a} style={{ '--a': `${a}deg` }} />)}
      </div>
      <h1 ref={heading} tabIndex={-1} style={{ outline: 'none' }}>{title}</h1>
      {gold && <p className="muted">Gold: no wrong answers.</p>}
      <div className="tiles">
        {tiles.map(([label, value]) => (
          <div className="tile" key={label}><strong>{value}</strong><span className="label">{label}</span></div>
        ))}
      </div>
      {banners.map(([icon, text]) => <p className="banner" key={text} role="status"><Icon name={icon} />{text}</p>)}
      {children ?? <Link href="/" className="btn">Continue<Icon name="arrow" /></Link>}
    </section>
  );
}
