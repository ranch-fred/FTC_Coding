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
| `lib/admin.js` | Mentor view maths: team summary and hardest questions. |
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

## The course

15 units, 90 lessons, about 360 steps. Each unit has 4 to 5 lessons and a boss, a badge, and a "why this matters on match day" note.

1 Welcome to FTC · 2 Programming basics · 3 Making decisions · 4 Repeating · 5 Functions · 6 Driving the robot · 7 Sensors · 8 Autonomous routines · 9 TeleOp · 10 Mechanisms · 11 Control · 12 Localization and paths · 13 Computer vision basics · 14 Debugging and teamwork · 15 Java for FTC

## Add a lesson

Open the unit file in `lib/curriculum/` and add a `lesson(...)` to its `lessons` list. To add a unit, copy a unit file and add it to the list in `lib/curriculum/index.js`. No UI code changes. Then run `npm test`.

The helpers in `lib/curriculum/helpers.js` build each step. They return plain data.

```js
lesson('my-lesson', 'My lesson', [        // id: unique, never change it later (progress is saved under it)
  card('Idea', ['Text with `code` and **bold**.', 'Second paragraph.'], { code: 'optional code block', diagram: { kind: 'compass' } }),
  choice('Question?', ['A', 'B', 'C'], 1, 'Why B is right.', { code: 'optional code to read' }),   // 1 = index of the answer
  order('Put in order.', ['first();', 'second();'], 'Why.'),                   // write the lines in the right order
  blank('Fill in.', 'robot.___(50);', ['forward'], 'Why.'),                    // one answer per ___; a list = alternatives
  match('Match them.', [['left item', 'right item'], ['servo', 'holds a position']], 'Why.'),
  predict('Where does it stop?', 'robot.forward(40);', { start: at(100, 20) }, 'Why.'),
  fix('Fix the bug.', 'broken code', { start: at(100, 20), goal: zone(85, 110, 115, 140) }, 'A hint.'),
  code('Reach the goal.', '// starter', { start: at(100, 20), goal: zone(85, 110, 115, 140) }, 'A hint.'),
], { xp: 10 })                             // optional; default 10. Use boss(...) for the last lesson of a unit (30 XP)
```

- `at(x, y, heading)` and `zone(x0, y0, x1, y1, colour)` are shortcuts. The field is 200 x 200 cm.
- Diagram kinds: `compass`, `cycle`, `system`, `timeline`, or `{ kind: 'field', field, code }` to animate a program.
- Any step can take `{ hint: '...' }`. Quiz steps need an explanation.
- Every `code` or `fix` step needs a passing solution in `tests/solutions.js`, keyed `<lesson id>/code` or `<lesson id>/fix`. A second programming step in one lesson needs `{ key: 'name' }`.
- Quiz step ids are `<lesson id>/<position>`. Practice history is stored under them, so add new steps at the end of a finished lesson.
- `npm test` checks the structure of every lesson, that each quiz answer grades as correct, that each reference solution passes from every possible start, and that no starter code already passes.

### Fields: what a programming step checks

A field describes the challenge. A step passes when the code runs without error and **every** check in its field is met.

| Field key | Meaning |
| --- | --- |
| `start: at(x, y, h)` | Where the robot starts. Leave it out for pure JavaScript steps (no field is drawn). |
| `obstacles: [zone(...)]` | Grey blocks. |
| `zones: [zone(x0, y0, x1, y1, 'red')]` | Floor colours for `robot.color()`. |
| `objects: [{ x, y }]` | Yellow objects to pick up. |
| `tags: [{ id, x, y }]` | Vision tags for `robot.detect()`. |
| `randomX`, `randomY: [min, max]`, `randomH: [90, 180]`, `randomStarts: [at(...), ...]` | Random start each run, so answers cannot be hard-coded. |
| `drift: { right: 0.1 }`, `inertia: 0.4` | Weaker side; seconds the motors take to change speed (coasting). |
| `lift: 30` | Lift height at the start. |
| `script: [{ for: 2, left_stick_y: -1 }, ...]` | TeleOp: what the driver does. The code must define `loop(gamepad)`. |
| **Checks** | |
| `goal: zone(...)` | Robot ends inside. |
| `goalHeading: [90, 3]` | Robot ends facing 90, within 3 degrees. |
| `deliver: { ...zone(...), count: 1, height: 40 }` | Objects released in the zone, with the lift at least this high. |
| `signal: { x, y, ids: [1, 2, 3], goals: { 1: zone(...), ... } }` | A random tag is shown; the robot must end in that tag's zone. |
| `endLift: [min, max]`, `noStrain: true` | Lift ends in range; lift motor never pushed against its end. |
| `expectLogs: ['line 1']` | Printed output matches. |
| `tests: [{ call: 'ticksFor(50)', equals: 500 }]` | The student's functions or variables give these values. |
| `noBump: true`, `timeLimit: 30` | No collisions; finished within the time (the robot freezes after it). |

## Robot API (JavaScript)

The simulator is JavaScript with an FTC-shaped API. The full list with descriptions is in `lib/api.js` and is shown under the editor in every programming step.

- Drive by distance: `robot.forward(cm)`, `backward(cm)`, `turn(deg)` (clockwise positive).
- Drive by power and time: `robot.setPower(left, right)`, `setMecanum(forward, strafe, turn)`, `wait(seconds)`, `stop()`, `drive(left, right, seconds)`, `time()`.
- Sensors: `distance()`, `touch()`, `bumped()`, `color()`, `heading()`, `encoders()`, `resetEncoders()`, `pose()`, `detect()`.
- Mechanisms: `claw(position)`, `liftPower(power)`, `liftTo(cm)`, `liftHeight()`, `liftAtBottom()`, `intake(power)`.
- Output: `robot.log(...)`, `telemetry.addData(caption, value)`.
- TeleOp: define `function loop(gamepad) { ... }`. It is called 20 times per simulated second.

The field is 200 x 200 cm. x goes right, y goes up, heading 0 points up. Full power is 50 cm per second.

## Mentor view

`/admin` (link at the bottom of the path). With Supabase, only emails in the `admins` table get data; in demo mode it shows sample teammates.

- **Team**: last active (red after 7 idle days), streak, level, XP, XP this week, lessons finished, gold lessons.
- **Progress by unit**: lessons finished per unit for every teammate.
- **Progress by lesson**: open a teammate to see every lesson as not started, started, done or gold.
- **Hardest questions**: the quiz questions with the most wrong answers across the team, with how many teammates missed each.
- **Course content**: every unit with its file name, and a **preview** link per lesson that opens it without locks and without recording answers.

The numbers are worked out in `lib/admin.js` from the same saved state the students use.

Editing lessons is file-based: change the unit file named in the Course content list, run `npm test`, commit, deploy.

## Security notes

- Row-level security: a teammate can read and write only their own row. Mentors (emails in `admins`) can read all rows. The database, not the browser, sets each row's email and timestamp.
- The leaderboard is a database function that returns only display name and weekly XP.
- XP is reported by the browser. A teammate who edits their own saved data can inflate their own XP. Nothing they do can read or change another teammate's data. Checking answers on a server would need a paid or always-on backend; this site does not have one.
