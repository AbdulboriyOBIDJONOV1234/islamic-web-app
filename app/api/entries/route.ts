import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get('userId')!;
  const date = searchParams.get('date');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const all = searchParams.get('all');

  if (date) {
    const rows = await sql`
      SELECT * FROM daily_entries WHERE user_id = ${userId} AND date = ${date} LIMIT 1
    `;
    return NextResponse.json(rows[0] || null);
  }

  if (start && end) {
    const rows = await sql`
      SELECT * FROM daily_entries
      WHERE user_id = ${userId} AND date >= ${start} AND date <= ${end}
      ORDER BY date ASC
    `;
    return NextResponse.json(rows);
  }

  if (all) {
    const rows = await sql`
      SELECT * FROM daily_entries WHERE user_id = ${userId}
      ORDER BY date DESC LIMIT 90
    `;
    return NextResponse.json(rows);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, date, bomdod, peshin, asr, shom, xufton, dhikr_count, salawat_count } = body;

  const rows = await sql`
    INSERT INTO daily_entries
      (user_id, date, bomdod, peshin, asr, shom, xufton, dhikr_count, salawat_count, updated_at)
    VALUES
      (${userId}, ${date}, ${bomdod}, ${peshin}, ${asr}, ${shom}, ${xufton},
       ${dhikr_count}, ${salawat_count}, NOW())
    ON CONFLICT (user_id, date) DO UPDATE SET
      bomdod = EXCLUDED.bomdod,
      peshin = EXCLUDED.peshin,
      asr = EXCLUDED.asr,
      shom = EXCLUDED.shom,
      xufton = EXCLUDED.xufton,
      dhikr_count = EXCLUDED.dhikr_count,
      salawat_count = EXCLUDED.salawat_count,
      updated_at = NOW()
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
