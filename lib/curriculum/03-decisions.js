import { lesson, boss, card, choice, order, blank, predict, match, code, at, zone } from './helpers.js';

const pads = [zone(25, 25, 55, 55, 'red'), zone(145, 25, 175, 55, 'blue')];
const threePads = [zone(25, 25, 55, 55, 'red'), zone(85, 25, 115, 55, 'yellow'), zone(145, 25, 175, 55, 'blue')];

export default {
  id: 'decisions',
  title: 'Making decisions',
  blurb: 'if, else, comparisons and logic: code that picks what to do.',
  matchDay: 'The field is never exactly the same twice. A robot that checks before it acts can pick the right plan for this match.',
  badge: { name: 'Decision maker', desc: 'Finish every lesson in Making decisions.' },
  lessons: [
    lesson('if', 'if', [
      card('Do it only if', [
        'An `if` statement runs a block of code only when a condition is `true`.',
        'The condition goes in round brackets. The block goes in curly brackets.',
        '`robot.distance()` gives the distance in cm to whatever is straight ahead.',
      ], { code: 'if (robot.distance() > 100) {\n  robot.forward(80);\n}' }),
      choice('The wall is 50 cm ahead. What happens?', ['The robot drives 80 cm', 'The robot drives 50 cm', 'Nothing: the condition is false', 'An error'], 2,
        '50 is not greater than 100, so the block is skipped.', { code: 'if (robot.distance() > 100) {\n  robot.forward(80);\n}' }),
      predict('The wall ahead is far away. Where does the robot stop?', 'if (robot.distance() > 100) {\n  robot.forward(80);\n}', { start: at(100, 20) },
        'The distance is more than 100, so the condition is true and the robot drives 80 cm.'),
      blank('Complete the statement so the robot only drives when the way is clear.', '___ (robot.distance() > 30) {\n  robot.forward(20);\n}', ['if'],
        '`if` checks the condition in the brackets before running the block.'),
    ]),
    lesson('if-else', 'if and else', [
      card('Otherwise', [
        '`else` adds a second block. It runs when the condition is `false`.',
        'Exactly one of the two blocks runs, never both.',
        '`robot.heading()` reads the gyro: the direction the robot faces in degrees. 0 is up the field, 180 is down.',
      ], { code: 'if (robot.heading() === 0) {\n  robot.forward(70);\n} else {\n  robot.backward(70);\n}' }),
      choice('`ready` is false. What is printed?', ['Go', 'Wait', 'Go then Wait', 'Nothing'], 1,
        'The condition is false, so the `else` block runs.', { code: 'if (ready) {\n  robot.log("Go");\n} else {\n  robot.log("Wait");\n}' }),
      order('Build an if / else that drives when the way is clear and turns when it is blocked.',
        ['if (robot.distance() > 30) {', '  robot.forward(20);', '} else {', '  robot.turn(90);', '}'],
        '`if (condition) {` opens the first block, `} else {` switches to the second, and `}` closes it.'),
      code('The robot starts facing up (0) or down (180). Either way, reach the goal at the top.', '// robot.heading() is 0 or 180\n',
        { start: at(100, 100), randomH: [0, 180], goal: zone(85, 150, 115, 185) },
        'Facing up: drive forward 70. Facing down: drive backward 70.'),
    ]),
    lesson('comparisons', 'Comparisons', [
      card('Six ways to compare', [
        '`===` is equal to. `!==` is not equal to.',
        '`<` less than, `>` greater than, `<=` less than or equal, `>=` greater than or equal.',
        'One `=` stores a value. Three `===` compare two values. Mixing them up is a very common bug.',
      ]),
      choice('What is the value of `5 >= 5`?', ['true', 'false', '5', '0'], 0,
        '`>=` means greater than **or equal**. 5 equals 5, so it is true.'),
      choice('Which line checks whether `color` is "red"?', ['if (color = "red")', 'if (color === "red")', 'if (color => "red")', 'if (color !== "red")'], 1,
        '`===` compares. A single `=` would store "red" into `color` instead of checking it.'),
      match('Match each operator to its meaning.', [
        ['`===`', 'Equal to'],
        ['`!==`', 'Not equal to'],
        ['`<=`', 'Less than or equal to'],
        ['`>`', 'Greater than'],
      ], 'These six comparison operators all produce a boolean.'),
      blank('Complete the condition: true when the battery is 12 volts or more.', 'const batteryOk = voltage ___ 12;', ['>='],
        '`>=` includes 12 itself.'),
    ]),
    lesson('logic', 'Logic operators', [
      card('And, or, not', [
        '`&&` means **and**: true only when both sides are true.',
        '`||` means **or**: true when at least one side is true.',
        '`!` means **not**: it flips true to false and false to true.',
      ], { code: 'const canScore = hasObject && distance < 10;' }),
      choice('`hasObject` is true and `distance` is 25. What is `hasObject && distance < 10`?', ['true', 'false', '25', 'An error'], 1,
        '`&&` needs both sides true. The distance check is false, so the whole thing is false.'),
      choice('`a` is false and `b` is true. What is `a || b`?', ['true', 'false', 'b', 'An error'], 0,
        '`||` is true when at least one side is true.'),
      blank('Complete the condition: the lift may move only when it is NOT at the top.', 'const mayRaise = ___atTop;', ['!'],
        '`!atTop` is true when `atTop` is false.'),
      code('Create two booleans. `canScore`: the robot holds an object AND is closer than 10. `mustWait`: the battery is below 11 OR time is above 28.',
        'const hasObject = true;\nconst distance = 6;\nconst battery = 12.4;\nconst time = 14;\n\n// const canScore = ...\n// const mustWait = ...\n',
        { tests: [{ call: 'canScore', equals: true }, { call: 'mustWait', equals: false }] },
        'canScore uses && with distance < 10. mustWait uses || with battery < 11 and time > 28.'),
    ]),
    lesson('else-if', 'More than two choices', [
      card('else if', [
        'Chain conditions with `else if` to choose between more than two paths.',
        'The robot checks them from the top and runs the first block whose condition is true. The rest are skipped.',
        '`robot.color()` reads the floor colour under the robot, for example `"red"`, `"blue"` or `"gray"`.',
      ], { code: 'if (robot.color() === "red") {\n  robot.turn(90);\n} else if (robot.color() === "blue") {\n  robot.turn(-90);\n} else {\n  robot.forward(10);\n}' }),
      choice('`score` is 75. What is printed?', ['Gold', 'Silver', 'Bronze', 'Silver then Bronze'], 1,
        '75 is not above 90, so the first check fails. 75 is above 60, so "Silver" prints and the rest is skipped.',
        { code: 'if (score > 90) {\n  robot.log("Gold");\n} else if (score > 60) {\n  robot.log("Silver");\n} else {\n  robot.log("Bronze");\n}' }),
      predict('The robot starts on a red pad. Where does it stop?',
        'robot.forward(80);\nif (robot.color() === "red") {\n  robot.turn(90);\n} else {\n  robot.turn(-90);\n}\nrobot.forward(80);',
        { start: at(100, 20), zones: [zone(85, 85, 115, 115, 'red')] },
        'After 80 cm the robot is on the red pad, so it turns right (90) and drives 80 cm to the right.'),
      code('The robot starts on the red pad (left) or the blue pad (right). Reach the goal at the top centre from either one.',
        'robot.forward(120);\n// red pad: the goal is to the right. blue pad: it is to the left.\n',
        { start: at(40, 40), randomStarts: [at(40, 40), at(160, 40)], zones: pads, goal: zone(85, 140, 115, 175) },
        'Read robot.color() BEFORE driving off the pad and keep it in a variable. Then turn 90 or -90 and drive 60.'),
    ]),
    boss('decisions-boss', 'Boss: three starting pads', [
      card('One program, three starts', [
        'At a competition you are told your starting position just before the match. One program has to handle every option.',
        'Here the robot starts on a red, yellow or blue pad. Read the colour first, then choose the route.',
      ]),
      choice('Why read the pad colour into a variable before driving?', ['Reading it twice is slower', 'After driving, the robot is no longer on the pad', 'Variables are required by the simulator', 'The sensor only works once'], 1,
        'The colour sensor reads the floor under the robot right now. Once it drives off the pad, the pad colour is gone.'),
      code('Start on red (left), yellow (centre) or blue (right). Park in the goal at the top centre.',
        'const start = robot.color();\n\n// "red", "yellow" or "blue"\n',
        { start: at(40, 40), randomStarts: [at(40, 40), at(100, 40), at(160, 40)], zones: threePads, goal: zone(85, 150, 115, 185), noBump: true },
        'All three drive forward 125 first. Then red turns right, blue turns left, and each of those drives 60 more. Yellow is already there.'),
    ]),
  ],
};
