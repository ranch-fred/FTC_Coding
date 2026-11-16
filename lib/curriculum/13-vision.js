import { lesson, boss, card, choice, blank, code, at, zone } from './helpers.js';

const parkBy = { x: 100, y: 190, ids: [1, 2, 3], goals: { 1: zone(20, 120, 60, 160), 2: zone(80, 120, 120, 160), 3: zone(140, 120, 180, 160) } };

export default {
  id: 'vision',
  title: 'Computer vision basics',
  blurb: 'Read what the camera reports, and choose what to do from it.',
  matchDay: 'Most seasons place something at random before Autonomous. The camera tells your robot which of three plans to run, and that is often worth more than anything else in the period.',
  badge: { name: 'Sharp eye', desc: 'Finish every lesson in Computer vision basics.' },
  lessons: [
    lesson('camera', 'What the camera reports', [
      card('Tags', [
        'FTC fields carry **AprilTags**: black and white squares, each with an ID number. The vision software finds them and reports numbers your code can use.',
        '`robot.detect()` gives the nearest tag the camera can see as `{ id, bearing, range }`.',
        '`id` is the tag\'s number. `bearing` is the angle to it in degrees: positive means it is to the right. `range` is the distance in cm.',
        'The camera sees about 35 degrees to each side. If no tag is in view, `detect()` gives `null`. Using `.id` on `null` is an error, so check first.',
      ], { code: 'const tag = robot.detect();\nif (tag !== null) {\n  robot.log(tag.id, tag.bearing, tag.range);\n}' }),
      choice('What does `robot.detect()` give when no tag is in view?', ['0', 'null', 'An empty string', 'The last tag seen'], 1,
        '`null` means "nothing". Always check for it before using the result.'),
      choice('`tag.bearing` is -12. Where is the tag?', ['12 degrees to the right', '12 degrees to the left', '12 cm away', 'Behind the robot'], 1,
        'Negative bearing means the tag is to the left of where the robot points.'),
      blank('Complete the check so the code only runs when a tag was found.', 'const tag = robot.detect();\nif (tag ___ null) {\n  robot.log(tag.id);\n}', ['!=='],
        '`tag !== null` is true when the camera found something.'),
    ]),
    lesson('decide', 'Deciding from a tag', [
      card('One of three plans', [
        'A common Autonomous task: a tag with ID 1, 2 or 3 is shown at random. Each ID means a different parking zone.',
        'Read the tag once at the start, while the robot is still and the tag is in view. Store the ID in a variable.',
        'Then use `if` / `else if` to pick the route.',
      ], { code: 'const id = robot.detect().id;\nif (id === 1) {\n  // left zone\n} else if (id === 2) {\n  // centre zone\n} else {\n  // right zone\n}' }),
      choice('Why read the tag before the robot starts moving?', ['The camera is off while driving', 'The tag is in view and the image is steady', 'Tags disappear after 1 second', 'Motors need the ID to start'], 1,
        'A still robot facing the tag gives the most reliable reading.'),
      choice('The ID is stored as `id`. Which check picks the plan for tag 2?', ['if (id = 2)', 'if (id === 2)', 'if (id > 2)', 'if (id === "two")'], 1,
        '`===` compares. The ID is a number.'),
      code('The tag at the top shows 1, 2 or 3. Park in the zone with the same number.', 'const id = robot.detect().id;\n// the zones are 110 cm up the field: 1 = left, 2 = centre, 3 = right\n',
        { start: at(100, 30), signal: parkBy },
        'After driving forward 110 you are in the centre zone. For 1: turn(-90) and forward(60). For 3: turn(90) and forward(60).'),
    ]),
    lesson('aim', 'Aiming with bearing', [
      card('Point at it', [
        '`bearing` is exactly the amount to turn to face the tag: `robot.turn(tag.bearing)`.',
        '`range` shrinks as you approach. Loop on it to stop a set distance away.',
        'Read the camera again each time round the loop. Old readings describe where the tag used to be.',
      ], { code: 'robot.turn(robot.detect().bearing);\nwhile (robot.detect().range > 20) {\n  robot.forward(5);\n}' }),
      choice('`tag.bearing` is 18. Which command faces the tag?', ['robot.turn(18)', 'robot.turn(-18)', 'robot.forward(18)', 'robot.turn(180)'], 0,
        'Positive bearing is to the right, and a positive turn is to the right.'),
      choice('Why call `robot.detect()` again inside the loop?', ['To use more battery', 'The range changes as the robot moves', 'The first call always fails', 'The ID changes'], 1,
        'A sensor reading is only true for the moment it was taken.'),
      code('Random start. Face the tag and drive until it is 20 cm away or less.', '// const tag = robot.detect();\n',
        { start: at(100, 30), randomStarts: [at(40, 40, 30), at(100, 30, 0), at(60, 90, 60)], tags: [{ id: 5, x: 150, y: 170 }], goal: zone(120, 140, 180, 195) },
        'Turn by the bearing first. Then loop while robot.detect().range > 20, driving 5 cm per lap.'),
    ]),
    lesson('no-tag', 'When the camera sees nothing', [
      card('Plan for null', [
        'Cameras fail in real matches: a tag is out of view, the light is bad, another robot blocks it.',
        'If the tag might be out of view, search: turn a little, look again, repeat.',
        'Always have a fallback. If nothing is found after a full turn or a time limit, run a safe default plan instead of crashing.',
      ], { code: 'while (robot.detect() === null) {\n  robot.turn(10);\n}' }),
      choice('The camera finds no tag in Autonomous. What is the best plan?', ['Stop and do nothing', 'Run a safe default route', 'Drive at full speed forward', 'Restart the program'], 1,
        'A default route still earns some points. A crash earns none.'),
      choice('What happens if you run `robot.detect().id` when no tag is in view?', ['It gives 0', 'An error: cannot read a property of null', 'It waits for a tag', 'It gives -1'], 1,
        '`null` has no properties. Check for `null` first.'),
      code('The robot starts facing away from the tag. Turn in small steps until the camera sees it, then face it exactly.', '// while (robot.detect() === null) { ... }\n',
        { start: at(100, 60, 180), randomH: [90, 180, 270], tags: [{ id: 7, x: 100, y: 180 }], goalHeading: [0, 3] },
        'Search with robot.turn(10) in a loop. When the tag is found, robot.turn(robot.detect().bearing).'),
    ]),
    boss('vision-boss', 'Boss: look, score, park', [
      card('A vision autonomous', [
        'The robot starts facing sideways. Find the tag, read its ID, score the object in the gold zone, then park in the zone that matches the ID.',
        'Read the ID before you drive off: later the tag may be out of view.',
      ]),
      choice('When should this routine read the tag ID?', ['After scoring', 'As soon as the tag is found, before driving away', 'While parking', 'It does not matter'], 1,
        'Read it while the tag is certainly in view and store it in a variable.'),
      code('Find the tag, score the object in the gold zone, then park in the zone numbered like the tag.',
        '// 1. search for the tag and face it\n// 2. remember the id\n// 3. score the object (it is 50 cm up the field from the start)\n// 4. back up 40, then park by id\n',
        {
          start: at(100, 40, 90), randomH: [90, 270],
          objects: [{ x: 100, y: 90 }],
          deliver: zone(80, 150, 120, 185),
          signal: { x: 100, y: 190, ids: [1, 2, 3], goals: { 1: zone(20, 90, 60, 130), 2: zone(140, 90, 180, 130), 3: zone(140, 30, 180, 70) } },
        },
        'Zone 1 is to the left and zone 2 to the right of where you are after backing up. Zone 3 is to the right and then down.'),
    ]),
  ],
};
