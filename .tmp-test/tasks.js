"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUserName = normalizeUserName;
exports.getMandatoryTasksForUser = getMandatoryTasksForUser;
exports.getMandatoryScore = getMandatoryScore;
exports.getMandatoryTaskState = getMandatoryTaskState;
exports.setMandatoryTaskState = setMandatoryTaskState;
exports.toggleMandatoryTask = toggleMandatoryTask;
const COMMON_TASKS = [
    {
        id: 'istighfar',
        label: "Astaghfirullah wa atubu ilaih",
        description: 'Har kuni istigfor ayting',
        points: 15,
        owner: 'both',
        category: 'Istiqomat',
    },
];
const ABDULBORIY_TASKS = [
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
const MOHINUR_TASKS = [
    {
        id: 'suhbat_kitobi',
        label: 'Suhbat kitobi',
        description: '1 ta mavzu',
        points: 20,
        owner: 'Mohinur',
        category: 'Kitob',
    },
    {
        id: 'zoom_speaking',
        label: 'Zoom / speaking',
        description: '1 ta mavzu',
        points: 20,
        owner: 'Mohinur',
        category: 'Nutq',
    },
    {
        id: 'ona_tili',
        label: 'Ona tili kursi vazifasi',
        description: 'Kurs topshiriqi',
        points: 20,
        owner: 'Mohinur',
        category: 'Ta\'lim',
    },
    {
        id: 'adabiyot',
        label: 'Adabiyot o\'qish',
        description: 'Kunlik o\'qish',
        points: 20,
        owner: 'Mohinur',
        category: 'Adabiyot',
    },
    {
        id: 'arab_speaking',
        label: 'Arab tili — speaking',
        description: 'Suhbat va nutq mashqlari',
        points: 20,
        owner: 'Mohinur',
        category: 'Til',
    },
    {
        id: 'arab_markaz',
        label: 'Arab tili — markaz vazifasi',
        description: 'Markaz topshiriqi',
        points: 20,
        owner: 'Mohinur',
        category: 'Til',
    },
    {
        id: 'quran_4',
        label: 'Qur\'on hatm',
        description: 'Kuniga 4 bet',
        points: 25,
        owner: 'Mohinur',
        category: 'Qur\'on',
    },
    {
        id: 'voqea',
        label: 'Vaqea surasi',
        description: 'O\'qish / yodlash',
        points: 15,
        owner: 'Mohinur',
        category: 'Qur\'on',
    },
    {
        id: 'mulk',
        label: 'Mulk surasi',
        description: 'O\'qish / yodlash',
        points: 15,
        owner: 'Mohinur',
        category: 'Qur\'on',
    },
];
function normalizeUserName(name) {
    return (name || '').trim().toLowerCase();
}
function getMandatoryTasksForUser(userName) {
    const normalized = normalizeUserName(userName);
    if (normalized.includes('abdulboriy')) {
        return [...COMMON_TASKS, ...ABDULBORIY_TASKS];
    }
    if (normalized.includes('mohinur')) {
        return [...COMMON_TASKS, ...MOHINUR_TASKS];
    }
    return [...COMMON_TASKS];
}
function getMandatoryScore(userName, doneMap = {}) {
    return getMandatoryTasksForUser(userName).reduce((total, task) => {
        if (doneMap[task.id])
            return total + task.points;
        return total;
    }, 0);
}
function getMandatoryTaskState(userId) {
    if (typeof window === 'undefined')
        return {};
    try {
        const raw = localStorage.getItem(`mandatory_tasks_${userId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch {
        return {};
    }
}
function setMandatoryTaskState(userId, state) {
    if (typeof window === 'undefined')
        return;
    localStorage.setItem(`mandatory_tasks_${userId}`, JSON.stringify(state));
}
function toggleMandatoryTask(userId, taskId) {
    const next = { ...getMandatoryTaskState(userId) };
    next[taskId] = !Boolean(next[taskId]);
    setMandatoryTaskState(userId, next);
    return next;
}
