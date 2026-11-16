import { lesson, boss, card, choice, order, blank, match, code, at, zone } from './helpers.js';

const skeleton = '@Autonomous(name = "Park")\npublic class Park extends LinearOpMode {\n    @Override\n    public void runOpMode() {\n        // set up hardware here\n        waitForStart();\n        // match code here\n    }\n}';

const javaAuto = 'leftDrive.setPower(0.5);\nrightDrive.setPower(0.5);\nsleep(2000);\n\nleftDrive.setPower(0.5);\nrightDrive.setPower(-0.5);\nsleep(500);\n\nleftDrive.setPower(1);\nrightDrive.setPower(1);\nsleep(1500);\n\nleftDrive.setPower(0);\nrightDrive.setPower(0);';

export default {
  id: 'java',
  title: 'Java for FTC',
  blurb: 'Everything you learned, in the language the real robot runs: OpModes, hardwareMap, DcMotor, telemetry.',
  matchDay: 'The Control Hub runs Java. The ideas are the ones you already know: only the spelling changes. After this unit you can read and edit your team\'s real robot code.',
  badge: { name: 'Java ready', desc: 'Finish every lesson in Java for FTC.' },
  lessons: [
    lesson('java-types', 'From JavaScript to Java', [
      card('Same ideas, stricter spelling', [
        'Java is the language of the FTC SDK. Loops, `if`, functions and comparisons look almost the same as in JavaScript.',
        'The big difference: every variable has a **type** that you must write. `double` is a number with decimals, `int` is a whole number, `boolean` is true or false, `String` is text.',
        'Functions are called **methods**, and they state the type they return. `void` means they return nothing.',
        'Compare values with `==` in Java (JavaScript uses `===`). Every statement ends with a semicolon.',
      ], { code: '// JavaScript\nconst power = 0.5;\nlet count = 0;\n\n// Java\ndouble power = 0.5;\nint count = 0;' }),
      match('Match each JavaScript line to its Java version.', [
        ['`const power = 0.5;`', 'double power = 0.5;'],
        ['`let count = 0;`', 'int count = 0;'],
        ['`const ready = true;`', 'boolean ready = true;'],
        ['`const name = "left";`', 'String name = "left";'],
      ], 'Java puts the type where JavaScript puts `const` or `let`.'),
      choice('Which Java type holds a motor power such as 0.75?', ['int', 'double', 'boolean', 'String'], 1,
        '`double` holds numbers with decimals. `int` would cut it down to 0.'),
      blank('Complete the Java line that declares a whole-number variable.', '___ targetTicks = 1200;', ['int'],
        '`int` is for whole numbers such as encoder ticks.'),
    ]),
    lesson('opmode', 'OpMode structure', [
      card('The shape of every program', [
        'A robot program in FTC is called an **OpMode**. The simplest kind is a `LinearOpMode`: code that runs from top to bottom, like the programs you have written here.',
        'The line starting with `@` is an annotation. `@Autonomous` or `@TeleOp` decides which list the program appears in on the Driver Station.',
        'Your code goes inside `runOpMode()`. Everything before `waitForStart()` runs when the driver presses INIT. Everything after it runs when they press START.',
      ], { code: skeleton }),
      order('Put the lines of a LinearOpMode in order.', ['@Autonomous(name = "Park")', 'public class Park extends LinearOpMode {', '    public void runOpMode() {', '        waitForStart();', '        // match code', '    }', '}'],
        'Annotation, class, method, wait for start, then the match code. Each open bracket is closed at the end.'),
      choice('What does `waitForStart()` do?', ['Starts the motors', 'Pauses the program until the driver presses START', 'Waits 30 seconds', 'Resets the encoders'], 1,
        'Hardware setup happens before it. The robot must not move until START is pressed.'),
      choice('Which annotation puts a program in the driver-controlled list?', ['@Autonomous', '@TeleOp', '@Override', '@Disabled'], 1,
        '`@TeleOp` programs appear in the TeleOp list on the Driver Station.'),
    ]),
    lesson('hardware-map', 'hardwareMap', [
      card('Connecting code to real parts', [
        'The robot\'s **configuration** on the Driver Station gives every motor, servo and sensor a name, such as `"left_drive"`.',
        '`hardwareMap.get(...)` looks a part up by that name and gives your code an object to control it.',
        'The name in the code must match the configuration exactly, including capitals. If it does not, the program stops with an error when INIT is pressed.',
      ], { code: 'DcMotor leftDrive = hardwareMap.get(DcMotor.class, "left_drive");\nServo claw = hardwareMap.get(Servo.class, "claw");' }),
      blank('Complete the line that looks up a motor named "right_drive".', 'DcMotor rightDrive = ___.get(DcMotor.class, "right_drive");', ['hardwareMap'],
        '`hardwareMap` holds every device from the robot configuration.'),
      choice('The code asks for "leftDrive" but the configuration says "left_drive". What happens?', ['The nearest name is used', 'An error at INIT: the device cannot be found', 'The motor runs backward', 'Nothing: names do not matter'], 1,
        'Names must match exactly. This is one of the most common errors at a competition.'),
      match('Match each hardware class to the part it controls.', [
        ['`DcMotor`', 'A motor'],
        ['`Servo`', 'A servo'],
        ['`DistanceSensor`', 'A distance sensor'],
        ['`TouchSensor`', 'A touch sensor'],
      ], 'Each kind of part has its own class with its own methods.'),
    ]),
    lesson('dcmotor', 'DcMotor', [
      card('Motors in Java', [
        'There is one object per motor, so a tank drive sets two powers: `leftDrive.setPower(0.5); rightDrive.setPower(0.5);`',
        '`sleep(1000)` waits 1000 milliseconds: one second. Our simulator\'s `robot.wait(1)` uses seconds.',
        'Motors on opposite sides face opposite ways, so one side is reversed in setup: `leftDrive.setDirection(DcMotor.Direction.REVERSE);`',
        '`getCurrentPosition()` reads the encoder in ticks.',
      ], { code: 'leftDrive.setPower(0.5);\nrightDrive.setPower(0.5);\nsleep(1000);\nleftDrive.setPower(0);\nrightDrive.setPower(0);' }),
      match('Match the simulator code to the FTC Java that does the same job.', [
        ['`robot.setPower(0.5, 0.5)`', 'leftDrive.setPower(0.5); rightDrive.setPower(0.5);'],
        ['`robot.wait(2)`', 'sleep(2000);'],
        ['`robot.encoders().left`', 'leftDrive.getCurrentPosition()'],
        ['`robot.stop()`', 'leftDrive.setPower(0); rightDrive.setPower(0);'],
      ], 'The ideas are identical. Java has one object per motor and counts time in milliseconds.'),
      choice('How long does `sleep(1500)` wait?', ['1500 seconds', '15 seconds', '1.5 seconds', '0.15 seconds'], 2,
        '`sleep` takes milliseconds. 1500 ms is 1.5 seconds.'),
      blank('Complete the Java line that reads the left motor\'s encoder.', 'int ticks = leftDrive.___();', ['getCurrentPosition'],
        '`getCurrentPosition()` returns the encoder count as an `int`.'),
    ]),
    lesson('java-teleop', 'Telemetry and TeleOp', [
      card('The TeleOp loop in Java', [
        'After `waitForStart()`, a TeleOp runs `while (opModeIsActive()) { ... }`. This is the `loop(gamepad)` you wrote in the TeleOp unit.',
        'The first driver\'s gamepad is `gamepad1` and the second driver\'s is `gamepad2`. The stick and button names are the ones you already know.',
        '`telemetry.addData("Heading", heading);` queues a line. Nothing appears on the Driver Station until you call `telemetry.update();`.',
      ], { code: 'waitForStart();\nwhile (opModeIsActive()) {\n    double drive = -gamepad1.left_stick_y;\n    double turn = gamepad1.right_stick_x;\n    leftDrive.setPower(drive + turn);\n    rightDrive.setPower(drive - turn);\n    telemetry.addData("Drive", drive);\n    telemetry.update();\n}' }),
      choice('Why is there a minus sign in `-gamepad1.left_stick_y`?', ['Java numbers are negative by default', 'Pushing the stick forward gives a negative y', 'The left motor is reversed', 'It is a typing mistake'], 1,
        'Exactly as in the simulator: forward on the stick is negative y.'),
      order('Put the lines of a Java TeleOp loop in order.', ['waitForStart();', 'while (opModeIsActive()) {', '    double drive = -gamepad1.left_stick_y;', '    leftDrive.setPower(drive);', '    telemetry.update();', '}'],
        'Wait for start, open the loop, read the stick, set the motor, send telemetry, close the loop.'),
      choice('You call `telemetry.addData` but nothing shows on the Driver Station. What is missing?', ['telemetry.update()', 'waitForStart()', 'A semicolon', 'sleep(1000)'], 0,
        '`addData` only queues the line. `update()` sends it.'),
    ]),
    lesson('java-sensors', 'Sensors and servos in Java', [
      card('The rest of the robot', [
        'A servo: `claw.setPosition(0.8);`. The position is 0 to 1, exactly as you used it.',
        'A distance sensor: `distance.getDistance(DistanceUnit.CM)`.',
        'A touch sensor: `touch.isPressed()` gives a boolean.',
        'The gyro lives in the hub\'s **IMU**: `imu.getRobotYawPitchRollAngles().getYaw(AngleUnit.DEGREES)`. Note that in the FTC SDK a positive yaw is counter-clockwise, the opposite of this simulator. Always test which way your numbers go.',
      ], { code: 'if (touch.isPressed()) {\n    lift.setPower(0);\n}' }),
      match('Match the simulator command to the FTC Java version.', [
        ['`robot.claw(1)`', 'claw.setPosition(1);'],
        ['`robot.distance()`', 'distance.getDistance(DistanceUnit.CM)'],
        ['`robot.touch()`', 'touch.isPressed()'],
        ['`robot.liftPower(0)`', 'lift.setPower(0);'],
      ], 'Each simulator command stands for one real SDK call.'),
      choice('What does `touch.isPressed()` return?', ['A distance in cm', 'A boolean', 'An angle', 'A String'], 1,
        'Pressed or not pressed: a boolean, just like `robot.touch()`.'),
      choice('In the FTC SDK, which direction is a positive yaw angle?', ['Clockwise', 'Counter-clockwise', 'Forward', 'It is always zero'], 1,
        'The SDK follows the maths convention: counter-clockwise is positive. This simulator uses clockwise. Check signs when you move code to the real robot.'),
    ]),
    boss('java-boss', 'Boss: translate an autonomous', [
      card('Read Java, drive the simulator', [
        'This is a real FTC autonomous in Java. Read it and work out what the robot does.',
        'Then write the same routine with the simulator commands. Remember: `sleep` uses milliseconds and `robot.wait` uses seconds.',
      ], { code: javaAuto }),
      choice('What does the middle block of the Java program do?', ['Drives forward for half a second', 'Spins clockwise for half a second', 'Stops for half a second', 'Drives backward for 5 seconds'], 1,
        'Left forward and right backward spins the robot clockwise. 500 ms is half a second.'),
      order('Put the Java lines in order to drive forward for one second and stop.', ['leftDrive.setPower(1);', 'rightDrive.setPower(1);', 'sleep(1000);', 'leftDrive.setPower(0);', 'rightDrive.setPower(0);'],
        'Set both powers, wait, then set both to zero.'),
      code('Write this Java routine with simulator commands so the robot ends in the goal.',
        '// leftDrive.setPower(a); rightDrive.setPower(b);  ->  robot.setPower(a, b);\n// sleep(ms);  ->  robot.wait(seconds);\n',
        { start: at(40, 60), goal: zone(100, 95, 130, 125) },
        'Three moves: setPower(0.5, 0.5) and wait(2); setPower(0.5, -0.5) and wait(0.5); setPower(1, 1) and wait(1.5). Then stop.',
        { code: javaAuto }),
    ]),
  ],
};
