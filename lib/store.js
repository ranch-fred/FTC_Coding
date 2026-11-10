// The only place the UI reads or writes saved data. Picks the backend once:
// Supabase when the env keys are set, localStorage (demo mode) when they are not.
// Both backends store the same player state object (see lib/game.js, newState).
import { supabase, configured } from './supabase';
import { demoStore } from './store-demo';
import { normalize } from './game';

export const demo = !configured;
export { DEMO_USER } from './store-demo';

const remote = {
  async load(user) {
    const { data, error } = await supabase.from('player_state').select('state').eq('user_id', user.id).maybeSingle();
    if (error) throw new Error(error.message);
    return normalize(data?.state);
  },
  // Returns '' on success or an error message. The database stamps email and updated_at itself.
  async save(user, state) {
    const { error } = await supabase.from('player_state').upsert({ user_id: user.id, state });
    return error ? error.message : '';
  },
  // [{ name, xp, you }]: weekly XP of teammates who chose a display name. Computed in the database.
  async leaderboard() {
    const { data } = await supabase.rpc('leaderboard');
    return data ?? [];
  },
  // { isAdmin, rows: [{ email, updated_at, state }] }. Row-level security decides what comes back.
  async adminData() {
    const [admin, players] = await Promise.all([
      supabase.from('admins').select('email').maybeSingle(),
      supabase.from('player_state').select('email,updated_at,state'),
    ]);
    const rows = (players.data ?? []).map((r) => ({ ...r, state: normalize(r.state) }));
    return { isAdmin: Boolean(admin.data), rows };
  },
};

export const store = demo ? demoStore(() => window.localStorage) : remote;
