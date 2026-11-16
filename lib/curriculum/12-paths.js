import { lesson, boss, card, choice, order, blank, predict, code, at, zone } from './helpers.js';

const mazeWalls = [zone(0, 70, 140, 80), zone(60, 120, 200, 130)];
const slalom = [zone(60, 0, 70, 130), zone(120, 70, 130, 200)];

export default {
  id: 'paths',
  title: 'Localization and paths',
  blurb: 'Know where the robot is, drive to coordinates, and follow a list of waypoints.',
  matchDay: 'Teams that drive to field coordinates can change an autonomous by editing a list of points. That is how you adapt to an alliance partner in the five minutes before a match.',
  badge: { name: 'Navigator', desc: 'Finish every lesson in Localization and paths.' },
  lessons: [
    lesson('pose', 'Pose', [
      card('Where am I?', [
        'A **pose** is the robot\'s position and direction: `x`, `y` and `heading`.',
        '`robot.pose()` gives `{ x, y, heading }`. On our field x goes right and y goes up, both in cm from the bottom-left corner.',
        'Real robots work out their pose from wheel encoders and the gyro. This is called **odometry**. Small errors add up, so teams correct it with other sensors.',
      ], { code: 'const p = robot.pose();\nrobot.log(p.x, p.y, p.heading);' }),
      choice('The robot starts at x = 100, y = 20 facing up and drives forward 50. What is its pose?', ['x 150, y 20', 'x 100, y 70', 'x 50, y 20', 'x 100, y 50'], 1,
        'Facing up, forward adds to y. 20 + 50 is 70.'),
      choice('What is odometry?', ['Reading a camera', 'Working out the pose from wheel and gyro measurements', 'Measuring battery voltage', 'A type of wheel'], 1,
        'Odometry tracks position by adding up small measured movements.'),
      predict('Where does the robot stop?', 'robot.turn(90);\nrobot.forward(120);\nrobot.turn(-90);\nrobot.forward(40);', { start: at(20, 60) },
        'It faces right and drives to x = 140, then faces up and drives to y = 100.'),
    ]),
    lesson('distance-to', 'Distance to a point', [
      card('How far is the target?', [
        'To drive to a point you need the differences: `dx = targetX - x` and `dy = targetY - y`.',
        'The straight-line distance is the long side of a right triangle. `Math.hypot(dx, dy)` works it out.',
        'With dx = 3 and dy = 4, the distance is 5.',
      ], { code: 'const dx = 3;\nconst dy = 4;\nrobot.log(Math.hypot(dx, dy)); // 5' }),
      choice('The robot is at (20, 20) and the target is at (20, 80). What are dx and dy?', ['dx 60, dy 0', 'dx 0, dy 60', 'dx 20, dy 80', 'dx 40, dy 100'], 1,
        'x does not change, so dx is 0. dy is 80 - 20 = 60.'),
      blank('Complete the line to get the straight-line distance.', 'const dist = Math.___(dx, dy);', ['hypot'],
        '`Math.hypot` returns the length of the diagonal.'),
      code('Write `distanceTo(x1, y1, x2, y2)` that returns the straight-line distance between two points.', '// function distanceTo(x1, y1, x2, y2) { ... }\n',
        { tests: [{ call: 'distanceTo(0, 0, 3, 4)', equals: 5 }, { call: 'distanceTo(10, 10, 10, 40)', equals: 30 }] },
        'return Math.hypot(x2 - x1, y2 - y1);'),
    ]),
    lesson('angle-to', 'Heading to a point', [
      card('Which way is the target?', [
        '`Math.atan2` turns dx and dy into an angle. On our field heading 0 is up and clockwise is positive, so write `Math.atan2(dx, dy)`: dx first.',
        'It answers in radians. Multiply by `180 / Math.PI` to get degrees.',
        'A target straight to the right (dx positive, dy zero) gives 90. Straight down gives 180. To the left gives -90, which is the same direction as 270.',
      ], { code: 'const heading = Math.atan2(dx, dy) * 180 / Math.PI;' }),
      choice('The target is straight to the right of the robot. What heading points at it?', ['0', '90', '180', '270'], 1,
        'On this field, 90 is right.'),
      choice('Why multiply by `180 / Math.PI`?', ['To convert radians to degrees', 'To convert cm to ticks', 'To make the angle positive', 'To round the number'], 0,
        '`Math.atan2` returns radians. The robot commands use degrees.'),
      code('Write `headingTo(dx, dy)` that returns the heading in degrees toward a point dx to the right and dy up.', '// function headingTo(dx, dy) { ... }\n',
        { tests: [{ call: 'headingTo(0, 10)', equals: 0 }, { call: 'headingTo(10, 0)', equals: 90 }, { call: 'headingTo(0, -10)', equals: 180 }, { call: 'headingTo(-10, 0)', equals: -90 }] },
        'return Math.atan2(dx, dy) * 180 / Math.PI;'),
    ]),
    lesson('go-to', 'Drive to coordinates', [
      card('goTo(x, y)', [
        'Put the last two lessons together and you get the most useful function in autonomous: drive to a point from wherever you are.',
        'Read the pose. Work out dx and dy. Turn by the needed heading minus the current heading. Drive the distance.',
        'Because it starts by reading the pose, it works from any starting position and direction.',
      ], { code: 'function goTo(tx, ty) {\n  const p = robot.pose();\n  const dx = tx - p.x;\n  const dy = ty - p.y;\n  robot.turn(Math.atan2(dx, dy) * 180 / Math.PI - p.heading);\n  robot.forward(Math.hypot(dx, dy));\n}' }),
      order('Put the steps of goTo in order.', ['Read the pose', 'Work out dx and dy', 'Turn to face the target', 'Drive the distance'],
        'You need the pose to get dx and dy, the turn must come before the drive.'),
      choice('Why does `goTo` subtract `p.heading` before turning?', ['turn() takes an amount to turn, not a heading to face', 'To make the robot slower', 'Headings are always negative', 'To reset the gyro'], 0,
        '`robot.turn` is relative. The amount to turn is the wanted heading minus the current one.'),
      code('The start position and direction are random. Write goTo and drive to the point (155, 155).', '// function goTo(tx, ty) { ... }\n\n// goTo(155, 155);\n',
        { start: at(40, 40), randomStarts: [at(40, 40, 0), at(100, 30, 90), at(30, 120, 180)], goal: zone(140, 140, 170, 170) },
        'Type in the function from the card, then call goTo(155, 155).'),
    ]),
    lesson('waypoints', 'Following a path', [
      card('A list of points', [
        'A path is a list of points to visit in order. Each point is called a **waypoint**.',
        'An array holds the list: `[[170, 20], [170, 100]]`. A loop calls `goTo` for each one.',
        'To change the route, edit the list. The driving code stays the same.',
      ], { code: 'const path = [[170, 20], [170, 100]];\nfor (const [x, y] of path) {\n  goTo(x, y);\n}' }),
      choice('How many waypoints does `[[30, 20], [30, 90], [150, 90]]` contain?', ['2', '3', '6', '1'], 1,
        'Each inner pair is one point. There are three pairs.'),
      choice('A wall is between the robot and the goal. How do you fix the path?', ['Raise the motor power', 'Add a waypoint that goes around the wall', 'Remove all the waypoints', 'Turn off the distance sensor'], 1,
        'A straight line between two waypoints must be clear. Add a point at the gap.'),
      code('The robot starts facing a random direction. Follow waypoints through both gaps to the goal without touching a wall.',
        'function goTo(tx, ty) {\n  const p = robot.pose();\n  const dx = tx - p.x;\n  const dy = ty - p.y;\n  robot.turn(Math.atan2(dx, dy) * 180 / Math.PI - p.heading);\n  robot.forward(Math.hypot(dx, dy));\n}\n\nconst path = [[170, 20]];\n// add more waypoints, then loop over the path\n',
        { start: at(30, 20), randomH: [0, 90, 180], obstacles: mazeWalls, goal: zone(15, 160, 45, 185), noBump: true },
        'Waypoints: (170, 20), (170, 100), (30, 100), (30, 170). Then: for (const [x, y] of path) { goTo(x, y); }'),
    ]),
    boss('paths-boss', 'Boss: slalom', [
      card('Your own path', [
        'Two long walls stick out into the field. Plan waypoints that go over the top of the first wall and under the bottom of the second.',
        'The robot is 16 cm wide, so keep the centre at least 10 cm away from every wall.',
        'The start changes each run. A path of field coordinates does not care.',
      ], { diagram: { kind: 'field', field: { start: at(30, 20), obstacles: slalom, goal: zone(150, 20, 190, 60) }, code: '' } }),
      choice('Why does a waypoint path still work when the start position changes?', ['The walls move too', 'goTo reads the real pose before every move', 'The first waypoint is skipped', 'It does not work'], 1,
        'Every `goTo` starts from the pose the robot actually has.'),
      code('Random start. Follow your own waypoints around both walls to the goal. No collisions, 30 seconds.',
        'function goTo(tx, ty) {\n  const p = robot.pose();\n  const dx = tx - p.x;\n  const dy = ty - p.y;\n  robot.turn(Math.atan2(dx, dy) * 180 / Math.PI - p.heading);\n  robot.forward(Math.hypot(dx, dy));\n}\n\n// const path = [[x, y], ...];\n',
        { start: at(30, 20), randomStarts: [at(30, 20, 0), at(30, 40, 90), at(20, 60, 270)], obstacles: slalom, goal: zone(150, 20, 190, 60), noBump: true, timeLimit: 30 },
        'One path that works: (30, 165), (95, 165), (95, 40), (170, 40).'),
    ]),
  ],
};
