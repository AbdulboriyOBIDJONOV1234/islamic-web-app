"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tasks_1 = require("./tasks");
const tasks = (0, tasks_1.getMandatoryTasksForUser)('Abdulboriy');
const score = (0, tasks_1.getMandatoryScore)('Abdulboriy', {
    ai: true,
    english: true,
    cyber: false,
    istighfar: true,
});
if (!tasks.some((task) => task.id === 'ai')) {
    throw new Error('Abdulboriy AI task missing');
}
if (score !== 60) {
    throw new Error(`Expected 60 points, got ${score}`);
}
console.log('mandatory task test passed');
