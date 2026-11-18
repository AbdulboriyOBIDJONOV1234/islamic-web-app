export type MandatoryTaskOwner = 'Abdulboriy' | 'Dilafruz' | 'both';

export interface MandatoryTask {
  id: string;
  label: string;
  description: string;
  points: number;
  owner: MandatoryTaskOwner;
  category: string;
}

const COMMON_TASKS: MandatoryTask[] = [
  {
    id: 'istighfar',
    label: "Astaghfirullah wa atubu ilaih",
    description: 'Har kuni istigfor ayting',
    points: 15,
    owner: 'both',
    category: 'Istiqomat',
  },
];

const ABDULBORIY_TASKS: MandatoryTask[] = [
  {
    id: 'ai',
    label: 'Sun\'iy intellekt (AI)',
    description: 'Kunlik mavzu',
    points: 25,
    owner: 'Abdulboriy',
    category: 'Rivojlanish',
  },
  {
    id: 'english',
    label: 'Ingliz tili',
    description: 'Grammatika darsi',
    points: 20,
    owner: 'Abdulboriy',
    category: 'Til',
  },
  {
    id: 'cyber',
    label: 'Kiberxavfsizlik / boshqa reja',
    description: 'Kunlik maqsad va reja',
    points: 20,
    owner: 'Abdulboriy',
    category: 'Xavfsizlik',
  },
];

const DILAFRUZ_TASKS: MandatoryTask[] = [
  {
    id: 'voqea',
    label: 'Vaqea surasi',
    description: 'O\'qish / yodlash',
    points: 15,
    owner: 'Dilafruz',
    category: 'Qur\'on',
  },
  {
    id: 'mulk',
    label: 'Mulk surasi',
    description: 'O\'qish / yodlash',
    points: 15,
    owner: 'Dilafruz',
    category: 'Qur\'on',
  },
];

export function normalizeUserName(name: string): string {
  return (name || '').trim().toLowerCase();
}

export function getMandatoryTasksForUser(userName: string): MandatoryTask[] {
  const normalized = normalizeUserName(userName);

  if (normalized.includes('abdulboriy')) {
    return [...COMMON_TASKS, ...ABDULBORIY_TASKS];
  }

  if (normalized.includes('dilafruz')) {
    return [...COMMON_TASKS, ...DILAFRUZ_TASKS];
  }

  return [...COMMON_TASKS];
}

export function getMandatoryScore(
  userName: string,
  doneMap: Record<string, boolean> = {},
): number {
  return getMandatoryTasksForUser(userName).reduce((total, task) => {
    if (doneMap[task.id]) return total + task.points;
    return total;
  }, 0);
}

export function getTasksScore(
  tasks: { id: string; points: number }[],
  doneMap: Record<string, boolean> = {},
): number {
  return tasks.reduce((total, task) => (doneMap[task.id] ? total + task.points : total), 0);
}

export function getMandatoryTaskState(userId: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(`mandatory_tasks_${userId}`);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function setMandatoryTaskState(userId: string, state: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`mandatory_tasks_${userId}`, JSON.stringify(state));
}

export function toggleMandatoryTask(userId: string, taskId: string) {
  const next = { ...getMandatoryTaskState(userId) };
  next[taskId] = !Boolean(next[taskId]);
  setMandatoryTaskState(userId, next);
  return next;
}
