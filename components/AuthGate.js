'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { demo, DEMO_USER } from '../lib/store';

// Renders children(user) once signed in; otherwise an email/password form.
// Demo mode (no Supabase keys) skips sign-in and uses a local demo user.
export default function AuthGate({ children }) {
  const [user, setUser] = useState(demo ? DEMO_USER : undefined); // undefined = loading
  const [mode, setMode] = useState('in');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (demo) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      // Keep the same object while the same person is signed in, so token refreshes do not reload progress.
      setUser((old) => (old && s?.user && old.id === s.user.id ? old : s?.user ?? null)),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    const f = new FormData(e.currentTarget);
    const creds = { email: f.get('email'), password: f.get('password') };
    const { data, error } =
      mode === 'in' ? await supabase.auth.signInWithPassword(creds) : await supabase.auth.signUp(creds);
    if (error) setMsg(error.message);
    else if (mode === 'up' && !data.session) setMsg('Check your email to confirm your account, then sign in.');
  }

  if (user === undefined) return <main><p>Loading…</p></main>;
  if (user) return children(user);
  return (
    <main>
      <form onSubmit={submit} className="card stack" style={{ maxWidth: 420, margin: '48px auto' }}>
        <h1>FTC Code Lab</h1>
        <h2>{mode === 'in' ? 'Sign in' : 'Create account'}</h2>
        <label>Email <input name="email" type="email" required autoComplete="email" /></label>
        <label>Password <input name="password" type="password" required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></label>
        <button type="submit" className="btn">{mode === 'in' ? 'Sign in' : 'Sign up'}</button>
        <button type="button" className="btn quiet" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </button>
        <p role="alert" className="alert">{msg}</p>
      </form>
    </main>
  );
}
