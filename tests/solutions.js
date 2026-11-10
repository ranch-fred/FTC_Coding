// Reference solutions for every programming step (type 'code' or 'fix'), keyed by step id.
// tests/curriculum.test.js fails if a programming step has no solution here or the solution does not pass.
// Kept out of lib/ so answers are not shipped to the browser.
export const solutions = {
  'drive-forward/5': 'robot.forward(100);',
  'turn/6': 'robot.forward(80);\nrobot.turn(90);\nrobot.forward(80);',
  'go-around/4':
    'robot.turn(90);robot.forward(50);robot.turn(-90);robot.forward(100);robot.turn(-90);robot.forward(50);robot.turn(90);robot.forward(50);',
  'maze/3':
    'robot.turn(90);robot.forward(140);robot.turn(-90);robot.forward(80);robot.turn(-90);robot.forward(140);robot.turn(90);robot.forward(70);',
  'sensor/5': 'while (robot.distance() > 15) {\n  robot.forward(5);\n}',
  'loops/5': 'for (let i = 0; i < 4; i++) {\n  robot.forward(40);\n  robot.turn(90);\n  robot.forward(40);\n  robot.turn(-90);\n}',
  'two-walls/4':
    'while (robot.distance() > 20) robot.forward(5);\nrobot.turn(90);\nwhile (robot.distance() > 20) robot.forward(5);',
  'heading/4': 'robot.turn(-robot.pose().heading);\nrobot.forward(70);',
};
