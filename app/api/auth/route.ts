import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';

type Row = Record<string, unknown>;

const ALLOWED = ['abdulboriy', 'mohinur'];

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { action, name, password } = await req.json();

  if (!name || !ALLOWED.includes(name.trim().toLowerCase())) {
    return NextResponse.json({ error: 'Ruxsat berilmagan ism' }, { status: 403 });
  }

  const trimmed = name.trim();

  // Check if user exists
  const rows = await sql`
    SELECT * FROM users WHERE LOWER(name) = LOWER(${trimmed}) LIMIT 1
  ` as Row[];
  const user = rows[0] || null;

  if (action === 'check') {
    return NextResponse.json({ exists: !!user });
  }

  if (action === 'register') {
    if (user) {
      return NextResponse.json({ error: 'Bu ism allaqachon ro\'yxatdan o\'tgan' }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ error: 'Parol kamida 4 ta belgi bo\'lishi kerak' }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    const newRows = await sql`
      INSERT INTO users (name, password_hash) VALUES (${trimmed}, ${hash}) RETURNING id, name, created_at
    ` as Row[];
    return NextResponse.json({ user: newRows[0] });
  }

  if (action === 'login') {
    if (!user) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }
    const hash = user.password_hash as string;
    if (!hash) {
      return NextResponse.json({ error: 'Parol o\'rnatilmagan. Qayta ro\'yxatdan o\'ting.' }, { status: 400 });
    }
    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return NextResponse.json({ error: 'Parol noto\'g\'ri' }, { status: 401 });
    }
    return NextResponse.json({ user: { id: user.id, name: user.name } });
  }

  return NextResponse.json({ error: 'Noto\'g\'ri so\'rov' }, { status: 400 });
}
