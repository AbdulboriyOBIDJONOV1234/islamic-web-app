import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');

  if (name) {
    const rows = await sql`SELECT * FROM users WHERE LOWER(name) = LOWER(${name}) LIMIT 1`;
    return NextResponse.json(rows[0] || null);
  }

  const rows = await sql`SELECT * FROM users ORDER BY created_at ASC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  const rows = await sql`
    INSERT INTO users (name) VALUES (${name.trim()})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
