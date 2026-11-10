'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { store } from '../lib/store';

const Ctx = createContext(null);
// { user, state, apply, saveError }. `apply(fn)` runs a game rule fn(state, now) from lib/game.js,
// stores the new state, saves it, and returns whatever the rule returned.
export const useGame = () => useContext(Ctx);

// A clock that re-renders every 20 seconds (battery refill, day change).
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function GameProvider({ user, children }) {
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const latest = useRef(null);
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    let on = true;
    store.load(user).then(
      (s) => { if (on) { latest.current = s; setState(s); } },
      (e) => { if (on) setLoadError(e.message || 'Unknown error'); },
    );
    return () => { on = false; };
  }, [user]);

  const apply = useCallback((fn) => {
    const out = fn(latest.current, new Date());
    const next = out.state ?? out;
    if (next === latest.current) return out;
    latest.current = next;
    setState(next);
    // Saves run one after another and always write the newest state.
    queue.current = queue.current
      .then(() => store.save(user, latest.current))
      .then((err) => setSaveError(err ? `Could not save progress: ${err}` : ''));
    return out;
  }, [user]);

  // Never start from a blank state when loading failed: saving it would overwrite real progress.
  if (loadError) {
    return (
      <main>
        <p role="alert" className="alert">Could not load your progress: {loadError}</p>
        <p><button className="btn" onClick={() => window.location.reload()}>Try again</button></p>
      </main>
    );
  }
  if (!state) return <main><p>Loading…</p></main>;
  return <Ctx.Provider value={{ user, state, apply, saveError }}>{children}</Ctx.Provider>;
}
