// The course. To add a unit: create a file in this folder and add it to the list below, in order.
// See README "Add a lesson" for the step format. Nothing in the UI needs to change.
import welcome from './01-welcome.js';
import basics from './02-basics.js';
import decisions from './03-decisions.js';
import loops from './04-loops.js';
import functions from './05-functions.js';
import driving from './06-driving.js';
import sensors from './07-sensors.js';
import autonomous from './08-autonomous.js';
import teleop from './09-teleop.js';
import mechanisms from './10-mechanisms.js';
import control from './11-control.js';
import paths from './12-paths.js';
import vision from './13-vision.js';
import debugging from './14-debugging.js';
import java from './15-java.js';

const files = [welcome, basics, decisions, loops, functions, driving, sensors, autonomous, teleop, mechanisms, control, paths, vision, debugging, java];

const QUIZ = new Set(['choice', 'order', 'blank', 'predict', 'match']);
const CODE = new Set(['code', 'fix']);
export const isQuiz = (step) => QUIZ.has(step.type); // auto-graded, can come back in practice
export const isCode = (step) => CODE.has(step.type); // graded by running the simulator

// Fill in defaults: lesson XP, and a stable step id: "<lesson id>/<key>" for programming steps,
// "<lesson id>/<position>" for the rest, unless the step sets its own id.
export const units = files.map((u) => ({
  ...u,
  lessons: u.lessons.map((l) => ({
    ...l,
    unitId: u.id,
    xp: l.xp ?? (l.boss ? 30 : 10),
    steps: l.steps.map((s, i) => ({ ...s, id: s.id ?? `${l.id}/${s.key ?? i + 1}`, lessonId: l.id })),
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
// randomY: [min, max], randomX: [min, max], randomH: [list of headings], or randomStarts: [list of starts].
// A signal tag is always random.
export function randomStart(field, rnd = Math.random) {
  const s = {};
  const between = ([a, b]) => a + Math.floor(rnd() * (b - a + 1));
  if (field.randomX) s.x = between(field.randomX);
  if (field.randomY) s.y = between(field.randomY);
  if (field.randomH) s.h = field.randomH[Math.floor(rnd() * field.randomH.length)];
  if (field.randomStarts) Object.assign(s, field.randomStarts[Math.floor(rnd() * field.randomStarts.length)]);
  if (field.signal) s.tag = field.signal.ids[Math.floor(rnd() * field.signal.ids.length)]; // which tag the camera sees
  return s;
}
