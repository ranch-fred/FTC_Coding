// Lessons are plain data. Add one by appending an object. Goal = rect the robot centre must end inside.
// Runs in plain JavaScript against an FTC-shaped robot API (see README); teaches the same ideas as OpMode Java/Blocks.
export const lessons = [
  {
    id: 'drive-forward',
    title: '1. Drive forward',
    text: 'The robot starts at the bottom. Use robot.forward(cm) to drive it into the green zone.',
    starter: '// distance is in cm\nrobot.forward(50);\n',
    start: { x: 100, y: 20, h: 0 },
    obstacles: [],
    goal: { x0: 85, x1: 115, y0: 110, y1: 140 },
  },
  {
    id: 'turn',
    title: '2. Turn a corner',
    text: 'Use robot.turn(degrees). Positive turns clockwise. Drive up, turn right, drive across to the green zone.',
    starter: 'robot.forward(80);\n// robot.turn(90);\n',
    start: { x: 20, y: 20, h: 0 },
    obstacles: [],
    goal: { x0: 90, x1: 110, y0: 90, y1: 110 },
  },
  {
    id: 'go-around',
    title: '3. Go around the box',
    text: 'The box blocks the straight path. Plan a route around it. robot.bumped() tells you if you hit something.',
    starter: '// the box is in the middle. Drive around it.\n',
    start: { x: 100, y: 20, h: 0 },
    obstacles: [{ x0: 70, x1: 130, y0: 80, y1: 110 }],
    goal: { x0: 85, x1: 115, y0: 160, y1: 185 },
  },
  {
    id: 'sensor',
    title: '4. Use the distance sensor',
    text: 'The start position is random every run, so you cannot hard-code a distance. Loop with robot.distance() and stop near the top wall.',
    starter: '// while (robot.distance() > 15) {\n//   robot.forward(5);\n// }\n',
    start: { x: 100, y: 20, h: 0 },
    randomY: [20, 80],
    obstacles: [],
    goal: { x0: 85, x1: 115, y0: 160, y1: 185 },
  },
  {
    id: 'loops',
    title: '5. Loops: climb the staircase',
    text: 'Repeating the same moves by hand is slow. Use a for loop to climb the staircase to the top-right zone: forward, turn right, forward, turn left, repeated.',
    starter: '// for (let i = 0; i < 4; i++) {\n//   robot.forward(40);\n//   robot.turn(90);\n//   ...\n// }\n',
    start: { x: 20, y: 20, h: 0 },
    obstacles: [],
    goal: { x0: 165, x1: 190, y0: 165, y1: 190 },
  },
  {
    id: 'maze',
    title: '6. Two-wall maze',
    text: 'Two walls each have a gap. Find your way to the top-left zone. Plan the route, then check it with the pose log: robot.log(robot.pose().x).',
    starter: '// gap 1 is on the right, gap 2 is on the left\n',
    start: { x: 30, y: 20, h: 0 },
    obstacles: [
      { x0: 0, x1: 140, y0: 70, y1: 80 },
      { x0: 60, x1: 200, y0: 120, y1: 130 },
    ],
    goal: { x0: 15, x1: 45, y0: 160, y1: 185 },
  },
  {
    id: 'two-walls',
    title: '7. Sensor to the corner',
    text: 'Reach the top-right corner zone. The start is random, so use robot.distance() twice: once heading up, once after turning right.',
    starter: '// drive up until close to the wall, turn, repeat toward the right wall\n',
    start: { x: 100, y: 20, h: 0 },
    randomY: [20, 80],
    obstacles: [],
    goal: { x0: 165, x1: 190, y0: 165, y1: 190 },
  },
  {
    id: 'heading',
    title: '8. Face the right way',
    text: 'The robot starts facing a random direction. Read it with robot.pose().heading, turn to face up (heading 0), then drive into the top zone.',
    starter: '// const h = robot.pose().heading;\n',
    start: { x: 100, y: 100, h: 90 },
    randomH: [90, 180, 270],
    obstacles: [],
    goal: { x0: 85, x1: 115, y0: 160, y1: 185 },
  },
];

export const getLesson = (id) => lessons.find((l) => l.id === id);

export function randomStart(lesson) {
  const s = {};
  if (lesson.randomY) {
    const [a, b] = lesson.randomY;
    s.y = a + Math.floor(Math.random() * (b - a + 1));
  }
  if (lesson.randomH) s.h = lesson.randomH[Math.floor(Math.random() * lesson.randomH.length)];
  return s;
}
