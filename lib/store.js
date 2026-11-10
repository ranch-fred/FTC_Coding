// The only place the UI reads or writes progress. Picks the backend once:
// Supabase when the env keys are set, localStorage (demo mode) when they are not.
import { supabase, configured } from './supabase';
import { demoStore, computeStats, dayOf } from './store-demo';

export const demo = !configured;
export { DEMO_USER } from './store-demo';

const remote = {
  // { done: Set of completed lesson ids, xp, streak }
  async summary(user) {
    const { data } = await supabase.from('progress').select('lesson_id,completed,updated_at').eq('user_id', user.id);
    const rows = data ?? [];
    return {
      done: new Set(rows.filter((r) => r.completed).map((r) => r.lesson_id)),
      ...computeStats(rows, rows.map((r) => dayOf(new Date(r.updated_at)))),
    };
  },
  // { code, completed } or null
  async loadLesson(user, lessonId) {
    const { data } = await supabase
      .from('progress').select('code,completed').eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle();
    return data;
  },
  // Returns '' on success or an error message.
  async saveLesson(user, lessonId, code, completed) {
    const { error } = await supabase
      .from('progress')
      .upsert({ user_id: user.id, lesson_id: lessonId, code, completed, updated_at: new Date().toISOString() });
    return error ? error.message : '';
  },
  // { isAdmin, rows: [{ email, lesson_id, completed, updated_at }] }. Row-level security decides what comes back.
  async adminData() {
    const [admin, progress] = await Promise.all([
      supabase.from('admins').select('email').maybeSingle(),
      supabase.from('progress').select('email,lesson_id,completed,updated_at'),
    ]);
    return { isAdmin: Boolean(admin.data), rows: progress.data ?? [] };
  },
};

export const store = demo ? demoStore(() => window.localStorage) : remote;
