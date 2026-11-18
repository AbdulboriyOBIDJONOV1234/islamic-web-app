import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Row = Record<string, unknown>;

const MAX_TASKS_PER_USER = 20;

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json([]);
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, user_id, label, points, created_at
      FROM custom_tasks WHERE user_id = ${userId} ORDER BY created_at ASC
    ` as Row[];
    return NextResponse.json(rows);
  } catch (err) {
    console.error('custom-tasks GET:', err);
    return NextResponse.json({ error: 'Vazifalarni o\'qib bo\'lmadi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const { userId, label, points } = await req.json();
    const text = typeof label === 'string' ? label.trim().slice(0, 80) : '';
    if (!userId || !text) {
      return NextResponse.json({ error: 'Vazifa nomi kerak' }, { status: 400 });
    }
    const pts = Math.min(50, Math.max(1, Math.round(Number(points) || 20)));

    const count = await sql`SELECT COUNT(*)::int AS n FROM custom_tasks WHERE user_id = ${userId}` as Row[];
    if (Number(count[0]?.n) >= MAX_TASKS_PER_USER) {
      return NextResponse.json({ error: `Eng ko'pi bilan ${MAX_TASKS_PER_USER} ta vazifa` }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO custom_tasks (user_id, label, points)
      VALUES (${userId}, ${text}, ${pts})
      RETURNING id, user_id, label, points, created_at
    ` as Row[];
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('custom-tasks POST:', err);
    return NextResponse.json({ error: 'Vazifani qo\'shib bo\'lmadi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const userId = req.nextUrl.searchParams.get('userId');
  if (!id || !userId) return NextResponse.json({ error: 'id va userId kerak' }, { status: 400 });
  try {
    const sql = getDb();
    await sql`DELETE FROM custom_tasks WHERE id = ${id} AND user_id = ${userId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('custom-tasks DELETE:', err);
    return NextResponse.json({ error: 'O\'chirib bo\'lmadi' }, { status: 500 });
  }
}
