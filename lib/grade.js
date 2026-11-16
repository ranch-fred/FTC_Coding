// Grading for the auto-checked step types. Pure functions: same input, same result.
// Code and fix steps are graded by the simulator instead (lib/sim.js, `passed`).
import { runProgram, FIELD } from './sim.js';

export const GRID = 5; // predict questions use a 5 x 5 grid of squares
export const CELL = FIELD / GRID;

const clampCell = (n) => Math.max(0, Math.min(GRID - 1, Math.floor(n / CELL)));
export const cellOf = (p) => ({ col: clampCell(p.x), row: clampCell(p.y) }); // row 0 is the bottom row

// Code compares without spaces or a trailing semicolon, but keeps upper/lower case (JavaScript does too).
const tidy = (s) => String(s ?? '').replace(/\s+/g, '').replace(/;$/, '');

export const blankCount = (step) => step.code.split('___').length - 1;
export const fillBlanks = (step, values) => {
  let i = 0;
  return step.code.replace(/___/g, () => values[i++] ?? '___');
};
const firstAccepted = (a) => (Array.isArray(a) ? a[0] : a);

// Returns { correct, expected } where `expected` is the right answer as text to show the student.
// Answer shapes: choice = option index, order = array of lines, blank = array of strings, predict = { col, row },
// match = array of the right-hand texts chosen.
export function grade(step, answer) {
  switch (step.type) {
    case 'choice':
      return { correct: answer === step.answer, expected: step.options[step.answer] };
    case 'order': {
      const got = Array.isArray(answer) ? answer : [];
      const correct = got.length === step.lines.length && step.lines.every((l, i) => tidy(l) === tidy(got[i]));
      return { correct, expected: step.lines.join('\n') };
    }
    case 'blank': {
      const got = Array.isArray(answer) ? answer : [];
      const correct = step.answers.every((a, i) => [].concat(a).some((ok) => tidy(ok) === tidy(got[i])));
      return { correct, expected: fillBlanks(step, step.answers.map(firstAccepted)) };
    }
    case 'predict': {
      const run = runProgram(step.code, step.field);
      const cell = cellOf(run.end);
      const correct = Boolean(answer) && answer.col === cell.col && answer.row === cell.row;
      return { correct, expected: `x = ${Math.round(run.end.x)} cm, y = ${Math.round(run.end.y)} cm`, cell, frames: run.frames };
    }
    case 'match': {
      // answer = the right-hand text chosen for each pair, in pair order
      const got = Array.isArray(answer) ? answer : [];
      const correct = step.pairs.every(([, right], i) => got[i] === right);
      return { correct, expected: step.pairs.map(([left, right]) => `${left}  =  ${right}`).join('\n') };
    }
    default:
      throw new Error(`Step type "${step.type}" is not auto-graded`);
  }
}

// Deterministic shuffle for "put the lines in order" (same step and attempt: same order, never already solved).
export function shuffled(items, seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) + i;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((v, i) => v === items[i])) out.push(out.shift());
  return out;
}
