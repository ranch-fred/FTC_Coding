// The robot commands students can use, shown as a cheat sheet under the code editor.
// Keep in step with the `robot` object in lib/sim.js.
export const API = [
  ['Drive by distance', [
    ['robot.forward(cm)', 'Drive forward. Stops early if blocked.'],
    ['robot.backward(cm)', 'Drive backward.'],
    ['robot.turn(degrees)', 'Spin on the spot. Positive is clockwise.'],
  ]],
  ['Drive by power and time', [
    ['robot.setPower(left, right)', 'Set the two drive motors, each from -1 to 1. They keep running.'],
    ['robot.setMecanum(forward, strafe, turn)', 'Mecanum drive, each from -1 to 1. Strafe right is positive.'],
    ['robot.wait(seconds)', 'Let time pass while the motors run.'],
    ['robot.stop()', 'Set drive power to 0.'],
    ['robot.drive(left, right, seconds)', 'Short for setPower, wait, stop.'],
    ['robot.time()', 'Seconds since the program started.'],
  ]],
  ['Sensors', [
    ['robot.distance()', 'cm to the nearest wall or obstacle straight ahead.'],
    ['robot.touch()', 'true when the front bumper is pressed against something.'],
    ['robot.bumped()', 'true if the robot has hit anything during this run.'],
    ['robot.color()', "Floor colour under the robot, for example 'red' or 'gray'."],
    ['robot.heading()', 'Gyro heading in degrees, 0 to 359.9. 0 is up the field.'],
    ['robot.encoders()', '{ left, right } wheel travel in ticks. 10 ticks = 1 cm.'],
    ['robot.resetEncoders()', 'Set both encoders back to 0.'],
    ['robot.pose()', '{ x, y, heading } position on the field in cm.'],
    ['robot.detect()', 'Camera: nearest tag in view as { id, bearing, range }, or null.'],
  ]],
  ['Mechanisms', [
    ['robot.claw(position)', 'Servo. 0 is open, 1 is closed. Closing grabs an object in front (lift must be down).'],
    ['robot.liftPower(power)', 'Run the lift motor, -1 to 1. It keeps running until set to 0.'],
    ['robot.liftTo(cm)', 'Move the lift to a height (0 to 60) and stop there.'],
    ['robot.liftHeight()', 'Lift height in cm.'],
    ['robot.liftAtBottom()', 'Limit switch: true when the lift is fully down.'],
    ['robot.intake(power)', 'Intake roller. 1 collects objects the robot touches, -1 pushes one out.'],
  ]],
  ['Output', [
    ['robot.log(...values)', 'Print a line under the editor.'],
    ['telemetry.addData(caption, value)', 'Print "caption: value", like FTC telemetry.'],
  ]],
];
