'use client';
import { useEffect, useState } from 'react';
import { supabase, configured } from '../lib/supabase';

// Renders children(user) once signed in; otherwise an email/password form.
export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [mode, setMode] = useState('in');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
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

  if (!configured) return <p role="alert">Missing Supabase settings. Copy .env.example to .env.local and fill it in.</p>;
  if (user === undefined) return <p>Loading…</p>;
  if (user) {
    return (
      <>
        <p className="bar">
          {user.email} <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </p>
        {children(user)}
      </>
    );
  }
  return (
    <form onSubmit={submit} className="card">
      <h2>{mode === 'in' ? 'Sign in' : 'Create account'}</h2>
      <label>Email <input name="email" type="email" required autoComplete="email" /></label>
      <label>Password <input name="password" type="password" required minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></label>
      <button type="submit">{mode === 'in' ? 'Sign in' : 'Sign up'}</button>
      <button type="button" className="link" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
      </button>
      <p role="alert">{msg}</p>
    </form>
  );
}
