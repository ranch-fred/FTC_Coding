# Robotics Practice

Teammates sign in, write robot code in the browser, watch a simulated robot run it, and progress is saved.

## Setup

1. Create a free project at supabase.com.
2. SQL Editor: paste and run `supabase/schema.sql`.
3. Authentication > Providers > Email: keep **Confirm email** ON (admin access is matched by email).
4. Run `insert into admins values ('your@email.com');` in the SQL Editor after you sign up.
5. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
6. `npm run dev`. Deploy: import the repo into Vercel and set the same two env vars.

## Add a lesson

Append an object to `lib/lessons.js` (start pose, obstacles, goal rectangle). Add a test to `tests/sim.test.js`. `npm test` runs the simulator tests.

## Robot API (JavaScript)

`robot.forward(cm)`, `robot.backward(cm)`, `robot.turn(deg)` (clockwise positive), `robot.distance()`, `robot.bumped()`, `robot.pose()`, `robot.log(...)`.
