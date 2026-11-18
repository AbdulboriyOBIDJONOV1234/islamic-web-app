import { getMandatoryTasksForUser, getMandatoryScore, type MandatoryTask } from './tasks';

const tasks = getMandatoryTasksForUser('Abdulboriy');
const score = getMandatoryScore('Abdulboriy', {
  ai: true,
  english: true,
  cyber: false,
  istighfar: true,
});

if (!tasks.some((task: MandatoryTask) => task.id === 'ai')) {
  throw new Error('Abdulboriy AI task missing');
}

if (score !== 60) {
  throw new Error(`Expected 60 points, got ${score}`);
}

console.log('mandatory task test passed');
