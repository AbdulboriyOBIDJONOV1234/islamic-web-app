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
  const {
    userId, date,
    bomdod, peshin, asr, shom, xufton,
    dhikr_count, salawat_count,
    subhanallah_count, alhamdulillah_count, allahu_akbar_count,
    la_ilaha_count, astaghfirullah_count, salawat_notes,
  } = body;

  const rows = await sql`
    INSERT INTO daily_entries
      (user_id, date, bomdod, peshin, asr, shom, xufton,
       dhikr_count, salawat_count,
       subhanallah_count, alhamdulillah_count, allahu_akbar_count,
       la_ilaha_count, astaghfirullah_count, salawat_notes,
       updated_at)
    VALUES
      (${userId}, ${date}, ${bomdod}, ${peshin}, ${asr}, ${shom}, ${xufton},
       ${dhikr_count}, ${salawat_count},
       ${subhanallah_count ?? 0}, ${alhamdulillah_count ?? 0}, ${allahu_akbar_count ?? 0},
       ${la_ilaha_count ?? 0}, ${astaghfirullah_count ?? 0}, ${salawat_notes ?? ''},
       NOW())
    ON CONFLICT (user_id, date) DO UPDATE SET
      bomdod = EXCLUDED.bomdod, peshin = EXCLUDED.peshin,
      asr = EXCLUDED.asr, shom = EXCLUDED.shom, xufton = EXCLUDED.xufton,
      dhikr_count = EXCLUDED.dhikr_count, salawat_count = EXCLUDED.salawat_count,
      subhanallah_count = EXCLUDED.subhanallah_count,
      alhamdulillah_count = EXCLUDED.alhamdulillah_count,
      allahu_akbar_count = EXCLUDED.allahu_akbar_count,
      la_ilaha_count = EXCLUDED.la_ilaha_count,
      astaghfirullah_count = EXCLUDED.astaghfirullah_count,
      salawat_notes = EXCLUDED.salawat_notes,
      updated_at = NOW()
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
