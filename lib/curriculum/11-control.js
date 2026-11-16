import { lesson, boss, card, choice, blank, match, code, fix, at, zone } from './helpers.js';

const bangBang = 'while (robot.distance() > 20) {\n  robot.setPower(1, 1);\n  robot.wait(0.02);\n}\nrobot.stop();\n';

export default {
  id: 'control',
  title: 'Control',
  blurb: 'Why robots overshoot, and how proportional control lands them on target.',
  matchDay: 'A robot that slams to a stop slides past its target and tips its load. Smooth control is faster overall because you do not have to correct afterward.',
  badge: { name: 'Controller', desc: 'Finish every lesson in Control.' },
  lessons: [
    lesson('overshoot', 'Overshoot', [
      card('Robots cannot stop instantly', [
        'A real robot has mass. When the motors are set to 0, it keeps rolling for a moment. Motors also take time to speed up.',
        'The fields in this unit simulate that. Stop at full speed and the robot coasts about 20 cm.',
        'Driving at full power until the target and then stopping is called **bang-bang** control. It goes past the target. That is **overshoot**.',
      ], { code: bangBang }),
      choice('What is overshoot?', ['Stopping before the target', 'Going past the target', 'Driving too slowly', 'Turning the wrong way'], 1,
        'Overshoot means the robot passes the target before it can stop.'),
      choice('Why does bang-bang control overshoot?', ['The sensor is wrong', 'The robot is still at full speed when it reaches the target', 'The loop is too slow', 'The battery is low'], 1,
        'Full speed right up to the target leaves no room to slow down.'),
      choice('Which simple change reduces overshoot?', ['Use more power', 'Slow down as the robot gets close', 'Remove the stop() call', 'Wait longer between readings'], 1,
        'Less speed near the target means less distance needed to stop. Proportional control does this automatically.'),
    ]),
    lesson('p-control', 'Proportional control', [
      card('Power from error', [
        'The **error** is how far you are from the target: `error = robot.distance() - target`.',
        '**Proportional control** sets the power from the error: `power = kP * error`. Far away means a big error and high power. Close means low power. At the target the power is zero.',
        '`kP` is a number you choose, called the gain. Keep the power between -1 and 1.',
        'Run the loop for a fixed time. A control loop should always have a timeout.',
      ], { code: 'const target = 20;\nconst kP = 0.03;\nwhile (robot.time() < 5) {\n  const error = robot.distance() - target;\n  const power = Math.max(-1, Math.min(1, kP * error));\n  robot.setPower(power, power);\n  robot.wait(0.02);\n}\nrobot.stop();' }),
      choice('The target is 20 cm and the sensor reads 50 cm. What is the error?', ['20', '30', '50', '70'], 1,
        'error = 50 - 20 = 30.'),
      choice('kP is 0.03 and the error is 10. What is the power?', ['0.03', '0.3', '3', '10'], 1,
        '0.03 × 10 = 0.3.'),
      blank('Complete the proportional control line.', 'const power = kP ___ error;', ['*'],
        'Power is the gain multiplied by the error.'),
      fix('This bang-bang code overshoots and misses the goal 20 cm from the wall. Change it to proportional control.',
        bangBang,
        { start: at(100, 20), inertia: 0.4, goal: zone(85, 164, 115, 180), noBump: true },
        'Use the loop from the card: error = distance - 20, power = kP * error clamped to -1..1, kP around 0.03, run for 5 seconds.'),
    ]),
    lesson('tuning', 'Tuning kP', [
      card('Finding a good gain', [
        'If `kP` is too low, the robot crawls and may not arrive in time.',
        'If `kP` is too high, the robot overshoots, reverses, overshoots again. This back-and-forth is called **oscillation**.',
        'Tune by testing: start low, raise `kP` until the robot just begins to overshoot, then back off a little. Change one thing per test.',
      ]),
      choice('The robot wobbles back and forth around the target. What should you try first?', ['Raise kP', 'Lower kP', 'Remove the clamp', 'Add a longer wait'], 1,
        'Oscillation means the gain is too high. Lower it.'),
      choice('The robot is smooth but takes 10 seconds to arrive. What should you try?', ['Raise kP', 'Lower kP', 'Set kP to 0', 'Remove the timeout'], 0,
        'A sluggish response means the gain is too low. Raise it step by step.'),
      match('Match the symptom to the cause.', [
        ['Oscillates around the target', 'kP too high'],
        ['Very slow to arrive', 'kP too low'],
        ['Never moves', 'kP is zero'],
      ], 'The gain sets how hard the robot reacts to error.'),
    ]),
    lesson('p-turn', 'Turning with control', [
      card('Proportional turns', [
        'The same idea turns the robot to a heading with the gyro. The error is `target - robot.heading()`.',
        'Headings wrap around: from 350 to 10 is +20 degrees, not -340. Bring the error into the range -180 to 180 so the robot takes the short way.',
        'Turn by giving the two sides opposite power: `robot.setPower(power, -power)`.',
      ], { code: 'function headingError(target) {\n  let e = target - robot.heading();\n  while (e > 180) e -= 360;\n  while (e < -180) e += 360;\n  return e;\n}' }),
      choice('The robot faces 350 and the target is 10. What is the short-way error?', ['-340', '20', '340', '-20'], 1,
        'From 350, turning 20 degrees clockwise reaches 10. That is much shorter than 340 the other way.'),
      choice('The error is positive: the target is clockwise from the robot. Which powers turn the right way?', ['setPower(p, p)', 'setPower(p, -p) with positive p', 'setPower(-p, p) with positive p', 'setPower(0, 0)'], 1,
        'Left forward and right backward spins clockwise.'),
      code('Random start heading. Turn to face right (heading 90) using proportional control, within 3 degrees.',
        'function headingError(target) {\n  let e = target - robot.heading();\n  while (e > 180) e -= 360;\n  while (e < -180) e += 360;\n  return e;\n}\n\n// loop for 4 seconds: power = kP * headingError(90)\n',
        { start: at(100, 100), randomH: [0, 180, 270], inertia: 0.3, goalHeading: [90, 3] },
        'kP around 0.01 works. Clamp the power to -1..1 and use robot.setPower(power, -power), then robot.wait(0.02).'),
    ]),
    lesson('pid', 'PID and smoothing', [
      card('Beyond P', [
        '**PID** adds two more terms to proportional control.',
        '**I** (integral) adds up error over time. It pushes a little harder when the robot stops just short of the target because friction holds it.',
        '**D** (derivative) looks at how fast the error is changing. It brakes when the robot approaches quickly, which reduces overshoot.',
        'Many FTC mechanisms work well with P alone or P and D. Add terms only when a test shows you need them.',
        '**Ramping** limits how fast power may change. It stops wheels slipping at the start and makes driving smoother.',
      ]),
      match('Match each PID term to what it responds to.', [
        ['P', 'The error right now'],
        ['I', 'Error added up over time'],
        ['D', 'How fast the error is changing'],
      ], 'P reacts to the present, I to the past, D to the trend.'),
      choice('The lift always stops 1 cm below the target and stays there. Which term helps most?', ['P', 'I', 'D', 'None'], 1,
        'A small error that never goes away is what the integral term is for.'),
      choice('The arm reaches the target fast but swings past it. Which term helps most?', ['I', 'D', 'A higher kP', 'A longer timeout'], 1,
        'The derivative term brakes as the arm closes in quickly.'),
      choice('What does ramping do?', ['Limits how quickly power changes', 'Raises the top speed', 'Reads the encoders faster', 'Turns off the motors'], 0,
        'Ramping changes power gradually so the wheels keep their grip.'),
    ]),
    boss('control-boss', 'Boss: smooth corner', [
      card('Control, twice', [
        'Drive to 20 cm from the top wall with proportional control, turn right, then do it again toward the right wall.',
        'This robot coasts. Bang-bang will hit the wall. Put the drive loop in a function so you can use it twice.',
        'A plain `robot.turn(90)` is fine for the turn.',
      ]),
      choice('Why put the proportional drive loop in a function?', ['Functions make motors stronger', 'It is used twice, so it is written and tuned once', 'Loops are not allowed outside functions', 'It removes the need for kP'], 1,
        'One tuned function, two calls.'),
      code('Reach the corner goal without touching a wall. The robot coasts, so use proportional control.',
        '// function driveToWall(target, seconds) { ... }\n',
        { start: at(60, 30), inertia: 0.35, goal: zone(160, 160, 184, 184), noBump: true },
        'Each drive loop needs its own time window: remember the start time with robot.time() and loop while less than about 5 seconds have passed.'),
    ]),
  ],
};
