# FTC Code Lab

Short daily lessons that teach FTC robot programming. Teammates follow a learning path, answer quick questions, and write code for a simulated robot. XP, streaks and a battery keep them coming back. Mentors see team progress.

Next.js 15 (App Router, plain JavaScript), plain CSS, Supabase for accounts and saved progress.

## Run it

```
npm install
npm run dev
```

With no `.env.local` the site runs in **demo mode**: no sign-in, progress saved in the browser (`localStorage`), sample teammates in the mentor view and leaderboard.

`npm test` runs every test. `npm run build` makes the production build.

## Setup with Supabase (real accounts, shared progress)

1. Create a free project at supabase.com.
2. SQL Editor: paste and run all of `supabase/schema.sql`. It is safe to run again after an update.
3. Authentication > Providers > Email: keep **Confirm email** ON (mentor access is matched by email).
4. Sign up on the site, then run `insert into admins values ('your@email.com');` in the SQL Editor.
5. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
6. `npm run dev`. Deploy: import the repo into Vercel and set the same two env vars.

## How it works

| Where | What |
| --- | --- |
| `lib/curriculum/` | The course, as data. One file per unit. |
| `lib/game.js` | All rules: XP, levels, streak, daily goal, battery, unlocking, spaced review, badges. Pure functions. |
| `lib/grade.js` | Grading for quiz steps. |
| `lib/sim.js` | The robot simulator. Student code runs in a Web Worker with a 2 second timeout (`lib/run-in-worker.js`). |
| `lib/store.js` | The only module that reads or writes saved data. Picks Supabase or `lib/store-demo.js` (localStorage). |
| `components/Player.js`, `components/steps.js` | The lesson player and one component per step type. |
| `app/` | Pages: path (`/`), lesson, practice, profile, leaderboard, mentor view (`/admin`). |
| `app/globals.css` | Design tokens (colours, type scale) and all styles. Dark by default, light theme optional. |
| `tests/` | Tests, plus `solutions.js`: a reference solution for every programming step. |

### Game rules

- **XP**: a lesson gives its `xp` (10, boss 30) the first time, 3 XP on a replay. Each hint used takes 2 XP off.
- **Gold**: finish a lesson with no wrong answers.
- **Battery**: 5 cells. A wrong quiz answer in a lesson drains one. One cell refills every 20 minutes; a practice session gives back 2. At zero, lessons are paused; practice always works.
- **Unlocking**: lessons open in order.
- **Practice**: every quiz answer is tracked. A right answer comes back after 1, 2, 4, 8, then 16 days; a wrong one comes back the same day and stays in "Review mistakes" until answered right in practice.
- **Streak**: days in a row with any XP. **Leaderboard**: XP over the last 7 days, only for teammates who choose a display name.

To change a rule, edit the constants at the top of `lib/game.js`.

## Add a lesson

Open the unit file in `lib/curriculum/` and add an object to its `lessons` list. To add a unit, copy a unit file and add it to the list in `lib/curriculum/index.js`. No UI code changes.

```js
{
  id: 'my-lesson',            // unique, never change it later (progress is saved under it)
  title: 'My lesson',
  xp: 10,                     // optional: default 10, or 30 with boss: true
  steps: [
    { type: 'card', title: 'Idea', body: ['Text with `code` in backticks.'], code: 'optional code block',
      diagram: { kind: 'compass' } },                       // or { kind: 'field', field, code }
    { type: 'choice', prompt: 'Question?', code: 'optional', options: ['A', 'B'], answer: 0, explain: 'Why.' },
    { type: 'order', prompt: 'Put in order.', lines: ['first();', 'second();'], explain: 'Why.' },
    { type: 'blank', prompt: 'Fill in.', code: 'robot.___(50);', answers: ['forward'], explain: 'Why.' },
    { type: 'predict', prompt: 'Where does it stop?', code: 'robot.forward(40);',
      field: { start: { x: 100, y: 20, h: 0 }, obstacles: [] }, explain: 'Why.' },
    { type: 'fix', prompt: 'Fix the bug.', starter: 'broken code', field: { start, obstacles, goal }, hint: 'Nudge.' },
    { type: 'code', prompt: 'Reach the goal.', starter: '// start here', field: { start, obstacles, goal }, hint: 'Nudge.' },
  ],
}
```

- A `blank` answer can be a list of accepted answers: `answers: [['-h', '360-h']]`.
- A field can randomise its start so distances cannot be hard-coded: `randomX: [min, max]`, `randomY: [min, max]`, `randomH: [90, 180]`.
- Any step can have a `hint`. Quiz steps need `explain`.
- Every `code` or `fix` step needs a passing solution in `tests/solutions.js`, keyed by step id (`<lesson id>/<position in the lesson>`). Changing the order of steps in a finished lesson changes those ids, so add new steps at the end or give a step its own `id`.
- Run `npm test`. It checks the structure of every lesson, that each quiz answer grades as correct, and that each reference solution passes.

## Robot API (JavaScript)

`robot.forward(cm)`, `robot.backward(cm)`, `robot.turn(deg)` (clockwise positive), `robot.distance()`, `robot.bumped()`, `robot.pose()`, `robot.log(...)`.

The field is 200 x 200 cm. x goes right, y goes up, heading 0 points up.

## Security notes

- Row-level security: a teammate can read and write only their own row. Mentors (emails in `admins`) can read all rows. The database, not the browser, sets each row's email and timestamp.
- The leaderboard is a database function that returns only display name and weekly XP.
- XP is reported by the browser. A teammate who edits their own saved data can inflate their own XP. Nothing they do can read or change another teammate's data. Checking answers on a server would need a paid or always-on backend; this site does not have one.
