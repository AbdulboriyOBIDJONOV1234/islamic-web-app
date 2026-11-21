import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;
type Slot = { img: string; at: string } | null;
const WHO = ['dilafruz', 'abdulboriy'] as const;
const NO_STORE = { 'Cache-Control': 'no-store' };

async function readState() {
  const sql = getDb();
  await sql`CREATE TABLE IF NOT EXISTS rozilik (
    who TEXT PRIMARY KEY,
    img TEXT NOT NULL,
    signed_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  const rows = (await sql`SELECT who, img, signed_at FROM rozilik`) as Row[];
  const out: Record<string, Slot> = { dilafruz: null, abdulboriy: null };
  for (const r of rows) out[String(r.who)] = { img: String(r.img), at: String(r.signed_at) };
  return out;
}

export async function GET() {
  return NextResponse.json(await readState(), { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const who = String(body.who || '');
  const img = String(body.img || '');

  if (!(WHO as readonly string[]).includes(who) || !img.startsWith('data:image/png;base64,') || img.length > 400_000) {
    return NextResponse.json({ error: 'Noto‘g‘ri so‘rov' }, { status: 400 });
  }

  const cur = await readState();
  if (cur[who]) return NextResponse.json({ error: 'Bu imzo allaqachon qo‘yilgan', state: cur }, { status: 409 });
  if (who === 'abdulboriy' && !cur.dilafruz) {
    return NextResponse.json({ error: 'Avval Dilafruz imzo qo‘yishi kerak', state: cur }, { status: 400 });
  }

  const sql = getDb();
  await sql`INSERT INTO rozilik (who, img) VALUES (${who}, ${img}) ON CONFLICT (who) DO NOTHING`;
  return NextResponse.json(await readState(), { headers: NO_STORE });
}
