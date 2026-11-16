import { lesson, boss, card, choice, order, blank, code, fix, at, zone } from './helpers.js';

const scoreZone = zone(80, 150, 120, 190);
const parkZone = zone(150, 20, 190, 60);

export default {
  id: 'autonomous',
  title: 'Autonomous routines',
  blurb: 'Sequence steps, pick up and score objects, use a state machine, and beat the 30-second clock.',
  matchDay: 'Autonomous is 30 seconds with no driver. A routine that scores one object and parks every single time beats a fancy one that works half the time.',
  badge: { name: 'Auto pilot', desc: 'Finish every lesson in Autonomous routines.' },
  lessons: [
    lesson('sequencing', 'Sequencing steps', [
      card('Plan in comments first', [
        'An autonomous routine is a sequence of steps. Write the plan as comments, then fill in the code under each comment.',
        'Every move takes time. This robot drives 50 cm per second and turns 180 degrees per second. `robot.time()` gives the seconds used so far.',
        'When a challenge has a time limit, the robot freezes when time runs out, just like the end of the real Autonomous period.',
      ], { code: '// 1. drive to the scoring zone\n// 2. score\n// 3. park' }),
      order('Put this autonomous plan in a sensible order.', ['Drive to the object', 'Pick up the object', 'Drive to the scoring zone', 'Release the object', 'Park'],
        'You cannot score an object before you hold it, and parking comes last so nothing is left undone.'),
      choice('The robot drives 50 cm per second. About how long does `robot.forward(150)` take?', ['1 second', '3 seconds', '15 seconds', '150 seconds'], 1,
        '150 cm at 50 cm per second is 3 seconds.'),
      code('Park in the far corner zone within 8 seconds.', '// plan: up, turn right, across\n',
        { start: at(30, 30), goal: zone(150, 150, 185, 185), timeLimit: 8 },
        'forward(130), turn(90), forward(130) takes under 6 seconds. A route with many small moves and turns may be too slow.'),
    ]),
    lesson('pick-up', 'Picking up objects', [
      card('The claw', [
        'The claw is a servo. `robot.claw(1)` closes it and `robot.claw(0)` opens it.',
        'Closing the claw grabs a yellow object if it is right in front of the robot: within about 10 cm of the front edge. The lift must be down.',
        'Opening the claw drops the object in front of the robot. If that spot is inside the gold scoring zone, it scores.',
      ], { diagram: { kind: 'field', field: { start: at(100, 20), objects: [{ x: 100, y: 80 }], deliver: scoreZone }, code: 'robot.forward(48);\nrobot.claw(1);\nrobot.forward(90);\nrobot.claw(0);' } }),
      choice('The object is 60 cm in front of the robot. What happens?', ['The claw grabs it', 'Nothing is grabbed: it is too far away', 'The robot drives to it', 'An error'], 1,
        'The claw only reaches about 10 cm. Drive closer first.', { code: 'robot.claw(1);' }),
      order('Put the commands in order to pick up an object and score it.', ['robot.forward(48);', 'robot.claw(1);', 'robot.forward(90);', 'robot.claw(0);'],
        'Drive to the object, close, drive to the zone, open.'),
      code('Pick up the yellow object and release it in the gold scoring zone.', '// the object is 60 cm ahead of the robot centre\n',
        { start: at(100, 20), objects: [{ x: 100, y: 80 }], deliver: scoreZone },
        'Stop about 12 cm short of the object so it sits at the front of the robot: forward(48). After grabbing, forward(90) reaches the zone.'),
    ]),
    lesson('scoring-height', 'Scoring up high', [
      card('The lift', [
        'Many FTC games score on something tall. A lift raises the claw.',
        '`robot.liftTo(cm)` moves the lift to a height from 0 to 60 cm. The bar at the top left of the field shows the height.',
        'When a scoring zone needs a height, the object only counts if the lift is at least that high when the claw opens.',
        'The claw can only grab when the lift is down, so the order matters: grab, lift, drive, release.',
      ]),
      choice('The scoring zone needs 40 cm. You open the claw with the lift at 0. What happens?', ['The object scores', 'The object is dropped but does not score', 'The lift rises by itself', 'The claw stays closed'], 1,
        'The object lands on the floor. It needed to be released at 40 cm or higher.'),
      blank('Complete the line to raise the lift to 45 cm.', 'robot.___(45);', ['liftTo'],
        '`robot.liftTo(45)` moves the lift to 45 cm and holds it there.'),
      code('Score the object in the gold zone with the lift at 40 cm or higher.', 'robot.forward(48);\nrobot.claw(1);\n// lift, drive, release\n',
        { start: at(100, 20), objects: [{ x: 100, y: 80 }], deliver: { ...scoreZone, height: 40 } },
        'After grabbing: robot.liftTo(45); robot.forward(90); robot.claw(0);'),
    ]),
    lesson('state-machines', 'State machines', [
      card('One step at a time, by name', [
        'A **state machine** gives each step of a routine a name, called a **state**. A variable remembers the current state.',
        'A loop looks at the state, does that step\'s work, then sets the next state.',
        'Real FTC code is built this way because the main loop must keep running: one glance at the `state` variable shows what the robot is doing, and each step is easy to change.',
      ], { code: 'let state = "TO_OBJECT";\nwhile (state !== "DONE") {\n  if (state === "TO_OBJECT") {\n    robot.forward(48);\n    state = "GRAB";\n  } else if (state === "GRAB") {\n    robot.claw(1);\n    state = "DONE";\n  }\n}' }),
      choice('In a state machine, what does the `state` variable hold?', ['The motor power', 'The name of the step the robot is on', 'The time left', 'The number of objects scored'], 1,
        'The state is the current step. The loop uses it to decide what to do next.'),
      choice('A state\'s code forgets to set the next state. What happens?', ['The robot skips to the end', 'The same step repeats forever', 'The program ends', 'The state resets to the first one'], 1,
        'The state never changes, so the loop runs the same step again and again.'),
      fix('This state machine gets stuck in one state. Find the bad transition and fix it so the object is scored.',
        'let state = "TO_OBJECT";\n\nwhile (state !== "DONE") {\n  if (state === "TO_OBJECT") {\n    robot.forward(48);\n    state = "GRAB";\n  } else if (state === "GRAB") {\n    robot.claw(1);\n    state = "GRAB";\n  } else if (state === "DELIVER") {\n    robot.forward(90);\n    robot.claw(0);\n    state = "DONE";\n  }\n}\n',
        { start: at(100, 20), objects: [{ x: 100, y: 80 }], deliver: scoreZone },
        'After grabbing, which state should come next? Look at the names of the states.'),
    ]),
    lesson('auto-timer', 'Racing the clock', [
      card('30 seconds, then freeze', [
        'When Autonomous ends, the robot stops wherever it is. Points for parking are lost if it is halfway there.',
        'Know how long each part takes. Do the reliable points first.',
        'Check `robot.time()` before starting something long: if there is not enough time left, skip it and park.',
      ], { code: 'if (robot.time() < 20) {\n  // enough time for one more cycle\n}' }),
      choice('There are 4 seconds left. Another scoring cycle takes 9 seconds and parking takes 3. What should the robot do?', ['Start the cycle', 'Park now', 'Wait', 'Spin in place'], 1,
        'The cycle cannot finish. Parking can. Take the sure points.'),
      choice('What happens to a robot that is still driving when Autonomous ends?', ['It finishes its move', 'It stops where it is', 'It drives back to the start', 'It gets extra time'], 1,
        'The program is stopped. A robot halfway to the parking zone earns nothing for parking.'),
      code('Score the object, then park in the blue goal zone. You have 12 seconds.', '// score first, then park at the bottom right\n',
        { start: at(100, 20), objects: [{ x: 100, y: 80 }], deliver: scoreZone, goal: parkZone, timeLimit: 12 },
        'After scoring, back up 30, turn right, drive 70, turn right again, and drive down about 88.'),
    ]),
    boss('auto-boss', 'Boss: full autonomous', [
      card('The full routine', [
        'Two objects, a high scoring zone, a parking zone and a 30-second clock.',
        'Break it into functions or states. Test one piece at a time: get the first object scoring before you write the second.',
        '`robot.log(robot.time())` shows how many seconds a part used.',
      ]),
      choice('What is the best way to build a long autonomous?', ['Write it all, then run it once', 'Add one step at a time and test after each', 'Copy another team\'s numbers', 'Make every move as fast as possible first'], 1,
        'Small steps make it obvious which line caused a problem.'),
      code('Score BOTH objects with the lift at 30 cm or higher, then park in the blue zone. 30 seconds.',
        '// objects: one at the left (60, 80), one at the right (140, 80)\n// scoring zone: top centre, needs lift >= 30\n// park: bottom right\n',
        { start: at(60, 20), objects: [{ x: 60, y: 80 }, { x: 140, y: 80 }], deliver: { ...scoreZone, height: 30, count: 2 }, goal: parkZone, timeLimit: 30 },
        'The lift must be back at 0 before the second grab. A helper function for "lift, release, lower" keeps it short.'),
    ]),
  ],
};
