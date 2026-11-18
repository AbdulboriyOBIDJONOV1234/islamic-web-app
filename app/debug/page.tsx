'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, getEntryByDate, getAllEntries } from '@/lib/supabase';
import { today } from '@/lib/utils';

export default function DebugPage() {
  const [out, setOut] = useState('yuklanmoqda...');

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('namoz_user');
      const session = raw ? JSON.parse(raw) : null;
      const r: Record<string, unknown> = { sessionId: session?.id, today: today() };
      let partnerId = '';

      try {
        const users = await getAllUsers();
        r.users = users.map((u) => u.name);
        const p = users.find((u) => String(u.id) !== String(session?.id));
        r.partner = p ? p.name : null;
        partnerId = p ? String(p.id) : '';
      } catch (e) { r.usersError = String(e); }

      try {
        const e = await getEntryByDate(session?.id, today());
        r.myTodayEntry = e ? 'bor' : 'yoq';
      } catch (e) { r.myTodayError = String(e); }

      try {
        const e = await getAllEntries(session?.id);
        r.myEntries = Array.isArray(e) ? e.length : typeof e;
      } catch (e) { r.myEntriesError = String(e); }

      if (partnerId) {
        try {
          const e = await getEntryByDate(partnerId, today());
          r.partnerTodayEntry = e ? 'bor' : 'yoq';
        } catch (e) { r.partnerTodayError = String(e); }
        try {
          const e = await getAllEntries(partnerId);
          r.partnerEntries = Array.isArray(e) ? e.length : typeof e;
        } catch (e) { r.partnerEntriesError = String(e); }
      }

      setOut(JSON.stringify(r, null, 2));
    })();
  }, []);

  return <pre style={{ padding: 16, whiteSpace: 'pre-wrap', color: '#000', background: '#fff' }}>{out}</pre>;
}
