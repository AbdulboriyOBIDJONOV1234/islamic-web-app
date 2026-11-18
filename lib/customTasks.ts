import type { MandatoryTask } from './tasks';

export interface CustomTask {
  id: string;
  user_id: string;
  label: string;
  points: number;
  created_at: string;
}

// Hech qachon xato tashlamaydi: jadval yo'q yoki tarmoq xato bo'lsa, bo'sh ro'yxat qaytadi.
export async function getCustomTasks(userId: string): Promise<CustomTask[]> {
  try {
    const res = await fetch(`/api/custom-tasks?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function addCustomTask(userId: string, label: string, points: number): Promise<CustomTask> {
  const res = await fetch('/api/custom-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, label, points }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCustomTask(userId: string, id: string): Promise<void> {
  const res = await fetch(`/api/custom-tasks?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await res.text());
}

export function customToMandatory(task: CustomTask, owner: string): MandatoryTask {
  return {
    id: `custom_${task.id}`,
    label: task.label,
    description: 'Shaxsiy vazifa',
    points: task.points,
    owner: owner as MandatoryTask['owner'],
    category: 'Shaxsiy',
  };
}
