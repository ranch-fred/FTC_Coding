const topGoal = { x0: 85, x1: 115, y0: 160, y1: 185 };
const cornerGoal = { x0: 165, x1: 190, y0: 165, y1: 190 };

export default {
  id: 'sense-and-repeat',
  title: 'Sense and repeat',
  blurb: 'Use the distance sensor and loops so the robot adapts instead of guessing.',
  matchDay: 'Robots never start in exactly the same spot twice. Sensors and loops let your autonomous still work when the setup is a little off.',
  badge: { name: 'Sensor scout', desc: 'Finish every lesson in Sense and repeat.' },
  lessons: [
    {
      id: 'sensor',
      title: 'Distance sensor',
      steps: [
        {
          type: 'card',
          title: 'Look before you drive',
          body: [
            '`robot.distance()` gives the distance in cm from the front of the robot to the nearest wall or obstacle straight ahead.',
            'A `while` loop repeats its block as long as the condition is true. Together they mean: keep driving until something is close.',
          ],
          code: 'while (robot.distance() > 15) {\n  robot.forward(5);\n}',
        },
        {
          type: 'choice',
          prompt: 'What does `robot.distance()` measure?',
          options: [
            'Distance to the nearest thing straight ahead',
            'Distance driven since the start',
            'Distance to the goal zone',
            'Distance to the nearest thing in any direction',
          ],
          answer: 0,
          explain: 'The sensor points forward only. It does not know where the goal is.',
        },
        {
          type: 'blank',
          prompt: 'Complete the loop so the robot stops 15 cm from the wall.',
          code: 'while (robot.___() > 15) {\n  robot.forward(5);\n}',
          answers: ['distance'],
          explain: 'The loop checks `robot.distance()` before every 5 cm step and stops when it is 15 or less.',
        },
        {
          type: 'choice',
          prompt: 'The start position changes every run. Why is the loop better than `robot.forward(140)`?',
          options: [
            'It stops in the right place from any start',
            'It makes the robot faster',
            'It uses less battery',
            'forward() cannot drive 140 cm',
          ],
          answer: 0,
          explain: 'A fixed distance is only right for one start. The sensor loop reacts to where the robot really is.',
        },
        {
          type: 'code',
          prompt: 'The start is different every run. Stop in the goal zone near the top wall.',
          starter: '// while (robot.distance() > 15) {\n//   robot.forward(5);\n// }\n',
          field: { start: { x: 100, y: 20, h: 0 }, randomY: [20, 80], obstacles: [], goal: topGoal },
          hint: 'Remove the // marks. The loop from the card solves it.',
        },
      ],
    },
    {
      id: 'loops',
      title: 'Loops',
      steps: [
        {
          type: 'card',
          title: 'Repeat with for',
          body: [
            'A `for` loop repeats a block a set number of times. `i` counts the laps: it starts at 0, the loop runs while `i < 4`, and `i++` adds one after each lap.',
            'If the count never reaches the limit, the loop never ends. That is an infinite loop.',
          ],
          code: 'for (let i = 0; i < 4; i++) {\n  robot.forward(40);\n  robot.turn(90);\n}',
        },
        {
          type: 'choice',
          prompt: 'How many times does the block run?',
          code: 'for (let i = 0; i < 4; i++) {\n  robot.forward(10);\n}',
          options: ['3', '4', '5', 'Forever'],
          answer: 1,
          explain: '`i` takes the values 0, 1, 2, 3. That is four laps. At 4 the condition `i < 4` is false.',
        },
        {
          type: 'predict',
          prompt: 'Where does the robot stop?',
          code: 'for (let i = 0; i < 2; i++) {\n  robot.forward(40);\n  robot.turn(90);\n  robot.forward(40);\n  robot.turn(-90);\n}',
          field: { start: { x: 20, y: 20, h: 0 } },
          explain: 'Each lap is one stair: 40 cm up and 40 cm right. Two laps is 80 up and 80 right.',
        },
        {
          type: 'order',
          prompt: 'Build a loop that drives forward then turns right, four times.',
          lines: ['for (let i = 0; i < 4; i++) {', '  robot.forward(40);', '  robot.turn(90);', '}'],
          explain: 'The `for` line opens the block, the two commands sit inside it, and `}` closes it.',
        },
        {
          type: 'fix',
          prompt: 'This staircase loop never ends. Fix the bug so the robot climbs to the goal zone.',
          starter:
            'for (let i = 0; i < 4; i--) {\n  robot.forward(40);\n  robot.turn(90);\n  robot.forward(40);\n  robot.turn(-90);\n}\n',
          field: { start: { x: 20, y: 20, h: 0 }, obstacles: [], goal: cornerGoal },
          hint: 'Look at how `i` changes after each lap. Does it ever reach 4?',
        },
      ],
    },
    {
      id: 'two-walls',
      title: 'Sensor to the corner',
      steps: [
        {
          type: 'card',
          title: 'Use a pattern twice',
          body: [
            'The drive-until-close loop works in any direction. Turn the robot and the sensor now looks at a different wall.',
            'Drive to the first wall, turn, then run the same loop again.',
          ],
          diagram: {
            kind: 'field',
            field: { start: { x: 100, y: 40, h: 0 } },
            code: 'while (robot.distance() > 20) robot.forward(5);\nrobot.turn(90);\nwhile (robot.distance() > 60) robot.forward(5);',
          },
        },
        {
          type: 'blank',
          prompt: 'After reaching the top wall, turn right to face the right wall.',
          code: 'while (robot.distance() > 20) {\n  robot.forward(5);\n}\nrobot.turn(___);',
          answers: ['90'],
          explain: 'A positive 90 is a quarter turn clockwise: from facing up to facing right.',
        },
        {
          type: 'choice',
          prompt: 'The robot faces the right wall, 100 cm away. What does this loop do?',
          code: 'while (robot.distance() > 20) {\n  robot.forward(5);\n}',
          options: [
            'Drives until 20 cm from the wall',
            'Drives exactly 20 cm',
            'Does nothing',
            'Drives into the wall',
          ],
          answer: 0,
          explain: 'It repeats 5 cm steps while more than 20 cm is left, so it stops about 20 cm from the wall.',
        },
        {
          type: 'code',
          prompt: 'Random start again. Reach the goal zone in the top-right corner.',
          starter: '// drive up until close to the wall, turn, repeat toward the right wall\n',
          field: { start: { x: 100, y: 20, h: 0 }, randomY: [20, 80], obstacles: [], goal: cornerGoal },
          hint: 'Stop about 20 cm from each wall. You need the loop twice with a turn between.',
        },
      ],
    },
    {
      id: 'heading',
      title: 'Boss: face the right way',
      boss: true,
      steps: [
        {
          type: 'card',
          title: 'Read your heading',
          body: [
            '`robot.pose().heading` is the direction the robot faces right now, in degrees from 0 to 359.',
            'To face up the field (heading 0) from any heading, turn back by that amount.',
          ],
          diagram: { kind: 'compass' },
        },
        {
          type: 'choice',
          prompt: '`robot.pose().heading` is 270. Which way does the robot face?',
          options: ['Up', 'Right', 'Down', 'Left'],
          answer: 3,
          explain: '0 is up, 90 right, 180 down, 270 left.',
        },
        {
          type: 'blank',
          prompt: 'Make the robot face up the field from any heading `h`.',
          code: 'const h = robot.pose().heading;\nrobot.turn(___);',
          answers: [['-h', '360-h', '0-h']],
          explain: 'Turning by `-h` undoes the current heading. `360 - h` also works: it goes the long way round.',
          hint: 'A negative number turns counter-clockwise.',
        },
        {
          type: 'code',
          prompt: 'The robot starts facing a random direction. Reach the goal zone at the top.',
          starter: '// const h = robot.pose().heading;\n',
          field: { start: { x: 100, y: 100, h: 90 }, randomH: [90, 180, 270], obstacles: [], goal: topGoal },
          hint: 'First turn to heading 0, then drive about 70 cm.',
        },
      ],
    },
  ],
};
