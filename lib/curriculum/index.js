// The course. To add a unit: create a file in this folder and add it to the list below, in order.
// See README "Add a lesson" for the step format. Nothing in the UI needs to change.
import firstDrives from './01-first-drives.js';
import senseAndRepeat from './02-sense-and-repeat.js';

const files = [firstDrives, senseAndRepeat];

const QUIZ = new Set(['choice', 'order', 'blank', 'predict']);
const CODE = new Set(['code', 'fix']);
export const isQuiz = (step) => QUIZ.has(step.type); // auto-graded, can come back in practice
export const isCode = (step) => CODE.has(step.type); // graded by running the simulator

// Fill in defaults: lesson XP, and a stable step id "<lesson id>/<position>" unless the step sets its own.
export const units = files.map((u) => ({
  ...u,
  lessons: u.lessons.map((l) => ({
    ...l,
    unitId: u.id,
    xp: l.xp ?? (l.boss ? 30 : 10),
    steps: l.steps.map((s, i) => ({ ...s, id: s.id ?? `${l.id}/${i + 1}`, lessonId: l.id })),
  })),
}));

export const lessons = units.flatMap((u) => u.lessons);
export const lessonOrder = lessons.map((l) => l.id);
export const getLesson = (id) => lessons.find((l) => l.id === id);
export const getUnit = (id) => units.find((u) => u.id === id);
export const quizSteps = lessons.flatMap((l) => l.steps.filter(isQuiz));
export const codeSteps = lessons.flatMap((l) => l.steps.filter(isCode));
const byId = new Map(lessons.flatMap((l) => l.steps).map((s) => [s.id, s]));
export const getStep = (id) => byId.get(id);

// A field may randomise its start so students cannot hard-code distances:
// randomY: [min, max], randomX: [min, max], randomH: [list of headings].
export function randomStart(field, rnd = Math.random) {
  const s = {};
  const between = ([a, b]) => a + Math.floor(rnd() * (b - a + 1));
  if (field.randomX) s.x = between(field.randomX);
  if (field.randomY) s.y = between(field.randomY);
  if (field.randomH) s.h = field.randomH[Math.floor(rnd() * field.randomH.length)];
  return s;
}
