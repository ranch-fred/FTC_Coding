import { runProgram } from './sim.js';
self.onmessage = ({ data }) => self.postMessage(runProgram(data.code, data.lesson, data.start));
