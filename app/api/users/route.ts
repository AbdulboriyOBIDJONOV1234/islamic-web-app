import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

type Row = Record<string, unknown>;

export async function GET(req: NextRequest) {
  const sql = getDb();
  const name = req.nextUrl.searchParams.get('name');

  if (name) {
    const rows = await sql`SELECT * FROM users WHERE LOWER(name) = LOWER(${name}) LIMIT 1` as Row[];
    return NextResponse.json(rows[0] || null);
  }

  const rows = await sql`SELECT * FROM users ORDER BY created_at ASC` as Row[];
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const sql = getDb();
  const { name } = await req.json();
  const rows = await sql`
    INSERT INTO users (name) VALUES (${name.trim()}) RETURNING *
  ` as Row[];
  return NextResponse.json(rows[0]);
}
