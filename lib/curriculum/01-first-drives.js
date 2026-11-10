// Field: 200 x 200 cm, x to the right, y up. Heading 0 = up, clockwise positive.
const open = (start, goal) => ({ start, obstacles: [], goal });
const box = [{ x0: 70, x1: 130, y0: 80, y1: 110 }];
const mazeWalls = [
  { x0: 0, x1: 140, y0: 70, y1: 80 },
  { x0: 60, x1: 200, y0: 120, y1: 130 },
];

export default {
  id: 'first-drives',
  title: 'First drives',
  blurb: 'Move the robot with code: forward, turn, and plan a route.',
  matchDay: 'Every autonomous routine starts with driving to the right spot. If the robot cannot drive a planned route, nothing else scores.',
  badge: { name: 'Rookie driver', desc: 'Finish every lesson in First drives.' },
  lessons: [
    {
      id: 'drive-forward',
      title: 'Drive forward',
      steps: [
        {
          type: 'card',
          title: 'Meet the field',
          body: [
            'The practice field is 200 cm wide and 200 cm tall. The orange circle is your robot. The white line shows its front.',
            'One command moves it: `robot.forward(cm)`. The number is how far to drive, in centimetres.',
          ],
          diagram: { kind: 'field', field: open({ x: 100, y: 20, h: 0 }), code: 'robot.forward(60);' },
        },
        {
          type: 'choice',
          prompt: 'What does this line do?',
          code: 'robot.forward(50);',
          options: ['Drives forward 50 cm', 'Drives forward for 50 seconds', 'Turns 50 degrees', 'Sets the speed to 50'],
          answer: 0,
          explain: 'The number inside the brackets is a distance in centimetres.',
        },
        {
          type: 'blank',
          prompt: 'Fill in the command that drives the robot 100 cm.',
          code: 'robot.___(100);',
          answers: ['forward'],
          explain: '`robot.forward(100)` drives 100 cm in the direction the robot faces.',
          hint: 'It is the opposite of backward.',
        },
        {
          type: 'predict',
          prompt: 'Where does the robot stop? Tap the square on the field.',
          code: 'robot.forward(40);\nrobot.forward(40);',
          field: { start: { x: 100, y: 20, h: 0 } },
          explain: 'Commands run in order, top to bottom. 40 cm then 40 cm more is 80 cm in total.',
        },
        {
          type: 'code',
          prompt: 'Drive the robot into the goal zone.',
          starter: '// distance is in cm\nrobot.forward(50);\n',
          field: open({ x: 100, y: 20, h: 0 }, { x0: 85, x1: 115, y0: 110, y1: 140 }),
          hint: 'The goal starts 90 cm above the robot. 50 cm is not enough.',
        },
      ],
    },
    {
      id: 'turn',
      title: 'Turn a corner',
      steps: [
        {
          type: 'card',
          title: 'Headings',
          body: [
            '`robot.turn(degrees)` spins the robot on the spot. A positive number turns clockwise (right). A negative number turns counter-clockwise (left).',
            'Heading 0 points up the field. 90 points right, 180 points down, 270 points left.',
          ],
          diagram: { kind: 'compass' },
        },
        {
          type: 'choice',
          prompt: 'The robot faces up the field. Which way does it face after this line?',
          code: 'robot.turn(90);',
          options: ['Left', 'Right', 'Down', 'Still up'],
          answer: 1,
          explain: 'Positive degrees turn clockwise. A quarter turn clockwise from up is right.',
        },
        {
          type: 'choice',
          prompt: 'What does this code do?',
          code: 'robot.forward(50);\nrobot.turn(-90);\nrobot.forward(50);',
          options: [
            'Drives up, then left',
            'Drives up, then right',
            'Drives up 100 cm',
            'Drives up, then back to the start',
          ],
          answer: 0,
          explain: '`turn(-90)` is a quarter turn counter-clockwise, so the second drive goes left.',
        },
        {
          type: 'order',
          prompt: 'Put the lines in order: drive up, turn right, drive across.',
          lines: ['robot.forward(80);', 'robot.turn(90);', 'robot.forward(60);'],
          explain: 'Drive first, then turn, then drive again. The turn changes where the next forward goes.',
        },
        {
          type: 'predict',
          prompt: 'Where does the robot stop?',
          code: 'robot.forward(80);\nrobot.turn(90);\nrobot.forward(40);',
          field: { start: { x: 20, y: 20, h: 0 } },
          explain: 'Up 80 cm, turn right, then 40 cm to the right.',
        },
        {
          type: 'code',
          prompt: 'Drive up, turn right, and stop in the goal zone.',
          starter: 'robot.forward(80);\n// robot.turn(90);\n',
          field: open({ x: 20, y: 20, h: 0 }, { x0: 90, x1: 110, y0: 90, y1: 110 }),
          hint: 'After turning right you still need to drive about 80 cm.',
        },
      ],
    },
    {
      id: 'go-around',
      title: 'Go around the box',
      steps: [
        {
          type: 'card',
          title: 'Obstacles',
          body: [
            'Grey blocks are obstacles. If the robot drives into one, it stops there and the rest of that move is lost.',
            '`robot.bumped()` gives `true` after a collision. The commands after it still run, from wherever the robot got stuck.',
          ],
          diagram: { kind: 'field', field: { start: { x: 100, y: 20, h: 0 }, obstacles: box }, code: 'robot.forward(150);' },
        },
        {
          type: 'choice',
          prompt: 'A box is 60 cm in front of the robot. What happens?',
          code: 'robot.forward(150);',
          options: [
            'The robot stops at the box',
            'The robot drives through the box',
            'The program shows an error and nothing moves',
            'The robot turns around by itself',
          ],
          answer: 0,
          explain: 'The robot is blocked at the box. No error: your code has to notice with `robot.bumped()` or avoid the box.',
        },
        {
          type: 'predict',
          prompt: 'The grey box is in the way. Where does the robot stop?',
          code: 'robot.forward(150);',
          field: { start: { x: 100, y: 20, h: 0 }, obstacles: box },
          explain: 'It stops when its front edge touches the box, well short of 150 cm.',
        },
        {
          type: 'fix',
          prompt: 'This route should go around the right side of the box, but one turn is wrong. Fix it.',
          starter:
            'robot.turn(90);\nrobot.forward(50);\nrobot.turn(90);\nrobot.forward(100);\nrobot.turn(-90);\nrobot.forward(50);\nrobot.turn(90);\nrobot.forward(50);\n',
          field: { start: { x: 100, y: 20, h: 0 }, obstacles: box, goal: { x0: 85, x1: 115, y0: 160, y1: 185 } },
          hint: 'After driving right, the robot must face up the field again. Which way is that turn?',
        },
      ],
    },
    {
      id: 'maze',
      title: 'Boss: two-wall maze',
      boss: true,
      steps: [
        {
          type: 'card',
          title: 'Plan, then code',
          body: [
            'Long routes go wrong one step at a time. Plan the route in words first: which gap, which turn, how far.',
            '`robot.log(...)` prints a line under the field. `robot.pose()` gives the position, for example `robot.log(robot.pose().x)`.',
          ],
          diagram: {
            kind: 'field',
            field: { start: { x: 30, y: 20, h: 0 }, obstacles: mazeWalls, goal: { x0: 15, x1: 45, y0: 160, y1: 185 } },
            code: '',
          },
        },
        {
          type: 'choice',
          prompt: 'What does this line print?',
          code: 'robot.log(robot.pose().x);',
          options: [
            'How far right the robot is, in cm',
            'How far up the robot is, in cm',
            'The direction the robot faces',
            'The letter x',
          ],
          answer: 0,
          explain: '`pose()` has `x` (right), `y` (up) and `heading`. Logging them is the fastest way to find where a route goes wrong.',
        },
        {
          type: 'code',
          prompt: 'Two walls, each with one gap. Reach the goal zone at the top left.',
          starter: '// gap 1 is on the right, gap 2 is on the left\n',
          field: { start: { x: 30, y: 20, h: 0 }, obstacles: mazeWalls, goal: { x0: 15, x1: 45, y0: 160, y1: 185 } },
          hint: 'Turn right first and drive to x = 170. Then go up 80 cm to sit between the walls.',
        },
      ],
    },
  ],
};
