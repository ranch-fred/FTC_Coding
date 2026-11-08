// Runs student code in a Worker so `while(true){}` can be killed instead of freezing the tab.
export function runInWorker(code, lesson, start) {
  return new Promise((resolve) => {
    const w = new Worker(new URL('./sim-worker.js', import.meta.url), { type: 'module' });
    const done = (r) => { clearTimeout(t); w.terminate(); resolve(r); };
    const t = setTimeout(() => done({ frames: [], logs: [], error: 'Your code ran too long (over 2 seconds). Is there an infinite loop?', passed: false }), 2000);
    w.onmessage = (e) => done(e.data);
    w.onerror = (e) => done({ frames: [], logs: [], error: e.message || 'Worker error', passed: false });
    w.postMessage({ code, lesson, start });
  });
}
