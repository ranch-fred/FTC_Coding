// Reference solutions for every programming step (type 'code' or 'fix'), keyed by step id.
// tests/curriculum.test.js fails if a programming step has no solution here or the solution does not pass.
// Kept out of lib/ so answers are not shipped to the browser.

const goTo = `function goTo(tx, ty) {
  const p = robot.pose();
  const dx = tx - p.x;
  const dy = ty - p.y;
  robot.turn(Math.atan2(dx, dy) * 180 / Math.PI - p.heading);
  robot.forward(Math.hypot(dx, dy));
}
`;
const follow = (points) => `${goTo}for (const [x, y] of ${JSON.stringify(points)}) goTo(x, y);`;
const deadzone = 'function deadzone(v) { return Math.abs(v) < 0.1 ? 0 : v; }\n';
const driveToWall = `function driveToWall(target, seconds) {
  const t0 = robot.time();
  while (robot.time() - t0 < seconds) {
    const error = robot.distance() - target;
    const power = Math.max(-1, Math.min(1, 0.03 * error));
    robot.setPower(power, power);
    robot.wait(0.02);
  }
  robot.stop();
  robot.wait(0.3);
}
`;

export const solutions = {
  // 1 Welcome
  'first-code/code': 'robot.forward(100);',
  'welcome-boss/code': 'robot.backward(105);',
  'welcome-boss/park': 'robot.forward(100);\nrobot.backward(55);',

  // 2 Programming basics
  'comments-output/code': 'robot.log("Hello, robot!");',
  'variables/code': 'const distance = 120;\nrobot.forward(distance);',
  'numbers/code': 'const cm = 85;\nconst ticksPerCm = 10;\nconst ticks = cm * ticksPerCm;',
  'strings/code': 'const team = 12345;\nrobot.log("Team " + team + " ready");',
  'booleans/code': 'const distance = 12;\nconst isClose = distance < 20;',
  'basics-boss/code': 'const up = 100;\nconst across = 60;\nrobot.forward(up);\nrobot.turn(90);\nrobot.forward(across);\nrobot.log("Route: " + (up + across) + " cm");',

  // 3 Making decisions
  'if-else/code': 'if (robot.heading() === 0) {\n  robot.forward(70);\n} else {\n  robot.backward(70);\n}',
  'logic/code': 'const hasObject = true;\nconst distance = 6;\nconst battery = 12.4;\nconst time = 14;\nconst canScore = hasObject && distance < 10;\nconst mustWait = battery < 11 || time > 28;',
  'else-if/code': 'const pad = robot.color();\nrobot.forward(120);\nif (pad === "red") {\n  robot.turn(90);\n} else {\n  robot.turn(-90);\n}\nrobot.forward(60);',
  'decisions-boss/code': 'const start = robot.color();\nrobot.forward(125);\nif (start === "red") {\n  robot.turn(90);\n  robot.forward(60);\n} else if (start === "blue") {\n  robot.turn(-90);\n  robot.forward(60);\n}',

  // 4 Repeating
  'loop-variable/code': 'for (let i = 3; i > 0; i--) {\n  robot.log(i);\n}\nrobot.log("Go!");',
  'while/code': 'while (robot.distance() > 15) {\n  robot.forward(5);\n}',
  'infinite-loops/fix': 'for (let i = 0; i < 4; i++) {\n  robot.forward(40);\n  robot.turn(90);\n  robot.forward(40);\n  robot.turn(-90);\n}',
  'loop-if/code': 'while (robot.color() !== "red") {\n  robot.forward(5);\n}',
  'loops-boss/code': 'for (let i = 0; i < 4; i++) {\n  robot.forward(30);\n  robot.turn(90);\n  robot.forward(30);\n  robot.turn(-90);\n}\nrobot.turn(90);\nwhile (robot.distance() > 15) {\n  robot.forward(5);\n}',

  // 5 Functions
  'define-call/code': 'function report() {\n  robot.log("Ready");\n}\nreport();\nreport();',
  'parameters/code': 'function stair(size) {\n  robot.forward(size);\n  robot.turn(90);\n  robot.forward(size);\n  robot.turn(-90);\n}\nstair(20);\nstair(40);\nstair(60);',
  'return/code': 'function ticksFor(cm) {\n  return cm * 10;\n}',
  'function-if/code': 'function clamp(v) {\n  if (v > 1) return 1;\n  if (v < -1) return -1;\n  return v;\n}',
  'functions-boss/code': 'function driveUntil(cm) {\n  while (robot.distance() > cm) {\n    robot.forward(5);\n  }\n}\ndriveUntil(20);\nrobot.turn(90);\ndriveUntil(20);',

  // 6 Driving
  'turn/code': 'robot.forward(80);\nrobot.turn(90);\nrobot.forward(80);',
  'go-around/fix': 'robot.turn(90);\nrobot.forward(50);\nrobot.turn(-90);\nrobot.forward(100);\nrobot.turn(-90);\nrobot.forward(50);\nrobot.turn(90);\nrobot.forward(50);',
  'tank-drive/code': 'robot.setPower(0.5, 0.5);\nrobot.wait(4.2);\nrobot.stop();',
  'power-time/code': 'robot.drive(0.5, -0.5, 0.5);\nrobot.drive(1, 1, 2.4);',
  'drift/fix': 'robot.drive(0.9, 1, 3);',
  'driving-boss/code': 'robot.turn(90);\nrobot.forward(140);\nrobot.turn(-90);\nrobot.forward(80);\nrobot.turn(-90);\nrobot.forward(140);\nrobot.turn(90);\nrobot.forward(70);',

  // 7 Sensors
  'distance/code': 'while (robot.distance() > 10) {\n  robot.forward(5);\n}',
  'touch/code': 'while (!robot.touch()) {\n  robot.forward(2);\n}\nrobot.backward(20);',
  'color/code': 'while (robot.color() !== "red") robot.forward(4);\nrobot.turn(90);\nwhile (robot.color() !== "blue") robot.forward(4);',
  'gyro/code': 'robot.turn(-robot.heading());\nrobot.forward(70);',
  'encoders/code': 'robot.resetEncoders();\nrobot.setPower(0.5, 0.5);\nwhile (robot.encoders().left < 1200) {\n  robot.wait(0.02);\n}\nrobot.stop();',
  'sensors-boss/code': 'robot.turn(-robot.heading());\nwhile (robot.distance() > 30) robot.forward(5);\nrobot.turn(90);\nwhile (robot.color() !== "blue") robot.forward(5);',

  // 8 Autonomous
  'sequencing/code': 'robot.forward(130);\nrobot.turn(90);\nrobot.forward(130);',
  'pick-up/code': 'robot.forward(48);\nrobot.claw(1);\nrobot.forward(90);\nrobot.claw(0);',
  'scoring-height/code': 'robot.forward(48);\nrobot.claw(1);\nrobot.liftTo(45);\nrobot.forward(90);\nrobot.claw(0);',
  'state-machines/fix': 'let state = "TO_OBJECT";\nwhile (state !== "DONE") {\n  if (state === "TO_OBJECT") {\n    robot.forward(48);\n    state = "GRAB";\n  } else if (state === "GRAB") {\n    robot.claw(1);\n    state = "DELIVER";\n  } else if (state === "DELIVER") {\n    robot.forward(90);\n    robot.claw(0);\n    state = "DONE";\n  }\n}',
  'auto-timer/code': 'robot.forward(48);\nrobot.claw(1);\nrobot.forward(90);\nrobot.claw(0);\nrobot.backward(30);\nrobot.turn(90);\nrobot.forward(70);\nrobot.turn(90);\nrobot.forward(88);',
  'auto-boss/code': `function score() {
  robot.liftTo(35);
}
function release() {
  robot.claw(0);
  robot.liftTo(0);
}
robot.forward(48);
robot.claw(1);
score();
robot.forward(92);
robot.turn(90);
robot.forward(28);
release();
robot.forward(52);
robot.turn(90);
robot.forward(68);
robot.claw(1);
score();
robot.turn(180);
robot.forward(68);
robot.turn(-90);
robot.forward(28);
release();
robot.turn(180);
robot.forward(58);
robot.turn(90);
robot.forward(120);`,

  // 9 TeleOp
  'gamepad/code': 'function loop(gamepad) {\n  robot.setPower(-gamepad.left_stick_y, -gamepad.right_stick_y);\n}',
  'arcade/code': 'function loop(gamepad) {\n  const drive = -gamepad.left_stick_y;\n  const turn = gamepad.right_stick_x;\n  robot.setPower(drive + turn, drive - turn);\n}',
  'deadzone/fix': `${deadzone}function loop(gamepad) {\n  const drive = deadzone(-gamepad.left_stick_y);\n  const turn = deadzone(gamepad.right_stick_x);\n  robot.setPower(drive + turn, drive - turn);\n}`,
  'mecanum/code': 'function loop(gamepad) {\n  robot.setMecanum(-gamepad.left_stick_y, gamepad.left_stick_x, gamepad.right_stick_x);\n}',
  'speed-modes/code': 'function loop(gamepad) {\n  const scale = gamepad.right_bumper ? 0.4 : 1;\n  const drive = -gamepad.left_stick_y * scale;\n  const turn = gamepad.right_stick_x * scale;\n  robot.setPower(drive + turn, drive - turn);\n}',
  'teleop-boss/code': `${deadzone}function loop(gamepad) {\n  const scale = gamepad.left_bumper ? 0.5 : 1;\n  const drive = deadzone(-gamepad.left_stick_y) * scale;\n  const turn = deadzone(gamepad.right_stick_x) * scale;\n  robot.setPower(drive + turn, drive - turn);\n  if (gamepad.a) robot.claw(1);\n  if (gamepad.b) robot.claw(0);\n}`,

  // 10 Mechanisms
  'servos/code': 'robot.forward(48);\nrobot.claw(1);\nrobot.forward(60);\nrobot.claw(0);',
  'lifts/code': 'robot.liftTo(40);',
  'limits/fix': 'robot.liftPower(1);\nwhile (robot.liftHeight() < 55) {\n  robot.wait(0.02);\n}\nrobot.liftPower(0);',
  'homing/code': 'robot.liftPower(-0.5);\nwhile (!robot.liftAtBottom()) {\n  robot.wait(0.02);\n}\nrobot.liftPower(0);',
  'intakes/code': 'robot.intake(1);\nrobot.forward(140);\nrobot.intake(-1);',
  'mech-boss/code': 'robot.forward(38);\nrobot.claw(1);\nrobot.liftTo(50);\nrobot.forward(100);\nrobot.claw(0);\nrobot.backward(48);\nrobot.liftTo(0);',

  // 11 Control
  'p-control/fix': 'const target = 20;\nconst kP = 0.03;\nwhile (robot.time() < 5) {\n  const error = robot.distance() - target;\n  const power = Math.max(-1, Math.min(1, kP * error));\n  robot.setPower(power, power);\n  robot.wait(0.02);\n}\nrobot.stop();',
  'p-turn/code': 'function headingError(target) {\n  let e = target - robot.heading();\n  while (e > 180) e -= 360;\n  while (e < -180) e += 360;\n  return e;\n}\nwhile (robot.time() < 4) {\n  const power = Math.max(-1, Math.min(1, 0.01 * headingError(90)));\n  robot.setPower(power, -power);\n  robot.wait(0.02);\n}\nrobot.stop();',
  'control-boss/code': `${driveToWall}driveToWall(20, 5);\nrobot.turn(90);\ndriveToWall(20, 5);`,

  // 12 Localization and paths
  'distance-to/code': 'function distanceTo(x1, y1, x2, y2) {\n  return Math.hypot(x2 - x1, y2 - y1);\n}',
  'angle-to/code': 'function headingTo(dx, dy) {\n  return Math.atan2(dx, dy) * 180 / Math.PI;\n}',
  'go-to/code': `${goTo}goTo(155, 155);`,
  'waypoints/code': follow([[170, 20], [170, 100], [30, 100], [30, 170]]),
  'paths-boss/code': follow([[30, 165], [95, 165], [95, 40], [170, 40]]),

  // 13 Vision
  'decide/code': 'const id = robot.detect().id;\nrobot.forward(110);\nif (id === 1) {\n  robot.turn(-90);\n  robot.forward(60);\n} else if (id === 3) {\n  robot.turn(90);\n  robot.forward(60);\n}',
  'aim/code': 'robot.turn(robot.detect().bearing);\nwhile (robot.detect().range > 20) {\n  robot.forward(5);\n}',
  'no-tag/code': 'while (robot.detect() === null) {\n  robot.turn(10);\n}\nrobot.turn(robot.detect().bearing);',
  'vision-boss/code': `while (robot.detect() === null) robot.turn(10);
const tag = robot.detect();
robot.turn(tag.bearing);
const id = tag.id;
robot.forward(38);
robot.claw(1);
robot.forward(72);
robot.claw(0);
robot.backward(40);
if (id === 1) {
  robot.turn(-90);
  robot.forward(60);
} else if (id === 2) {
  robot.turn(90);
  robot.forward(60);
} else {
  robot.turn(90);
  robot.forward(60);
  robot.turn(90);
  robot.forward(60);
}`,

  // 14 Debugging
  'errors/fix': 'const distance = 110;\nrobot.forward(distance);',
  'telemetry-debug/fix': 'while (robot.distance() > 15) {\n  robot.forward(5);\n}',
  'debug-boss/fix': 'const STAIRS = 4;\nfor (let i = 0; i < STAIRS; i++) {\n  robot.forward(40);\n  robot.turn(90);\n  robot.forward(40);\n  robot.turn(-90);\n}',

  // 15 Java
  'java-boss/code': 'robot.setPower(0.5, 0.5);\nrobot.wait(2);\nrobot.setPower(0.5, -0.5);\nrobot.wait(0.5);\nrobot.setPower(1, 1);\nrobot.wait(1.5);\nrobot.stop();',
};
