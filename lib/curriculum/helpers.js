// Short ways to write lessons and steps. Each returns plain data; see README "Add a lesson".
// `extra` is an object of optional fields, for example { hint: '...' } or { code: '...' }.

export const lesson = (id, title, steps, extra = {}) => ({ id, title, steps, ...extra });
// The last lesson of a unit: a longer challenge worth more XP.
export const boss = (id, title, steps, extra = {}) => ({ id, title, steps, boss: true, ...extra });

// Concept card. body = one string or a list of paragraphs. extra: { code, diagram }.
export const card = (title, body, extra = {}) => ({ type: 'card', title, body: [].concat(body), ...extra });
// Multiple choice. answer = index of the right option (0 is the first). extra: { code, hint }.
export const choice = (prompt, options, answer, explain, extra = {}) => ({ type: 'choice', prompt, options, answer, explain, ...extra });
// Put the lines in order. Write them in the correct order; the app shuffles them.
export const order = (prompt, lines, explain, extra = {}) => ({ type: 'order', prompt, lines, explain, ...extra });
// Fill the blanks. Each ___ in `code` needs one entry in `answers`; an entry can be a list of accepted answers.
export const blank = (prompt, code, answers, explain, extra = {}) => ({ type: 'blank', prompt, code, answers, explain, ...extra });
// Predict where the robot stops. The answer is worked out by running `code` on `field`.
export const predict = (prompt, code, field, explain, extra = {}) => ({ type: 'predict', prompt, code, field, explain, ...extra });
// Match each left item to its right item. pairs = [[left, right], ...].
export const match = (prompt, pairs, explain, extra = {}) => ({ type: 'match', prompt, pairs, explain, ...extra });
// Write code. extra.code shows a read-only reference block above the editor. Step id is "<lesson id>/code"; pass { key: 'other' } in extra for a second one in the same lesson.
export const code = (prompt, starter, field, hint, extra = {}) => ({ type: 'code', key: 'code', prompt, starter, field, hint, ...extra });
// Fix the bug in `starter`. Step id is "<lesson id>/fix".
export const fix = (prompt, starter, field, hint, extra = {}) => ({ type: 'fix', key: 'fix', prompt, starter, field, hint, ...extra });

// Field helpers. Field is 200 x 200 cm, x right, y up, heading 0 = up, clockwise positive.
export const at = (x, y, h = 0) => ({ x, y, h });
export const zone = (x0, y0, x1, y1, color) => (color ? { x0, y0, x1, y1, color } : { x0, y0, x1, y1 });
