'use client';

import { useEffect, useState } from 'react';

type U = { id: string; name: string };

export default function DebugPage() {
  const [out, setOut] = useState('yuklanmoqda...');

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('namoz_user');
      const session: U | null = raw ? JSON.parse(raw) : null;
      let status = 0;
      let list: U[] = [];
      let err = '';
      try {
        const r = await fetch('/api/users', { cache: 'no-store' });
        status = r.status;
        const body = await r.json();
        list = Array.isArray(body) ? body : [];
      } catch (e) {
        err = String(e);
      }
      const partner = list.find((u) => String(u.id) !== String(session?.id)) || null;
      setOut(JSON.stringify({
        origin: location.origin,
        session,
        usersStatus: status,
        usersCount: list.length,
        userNames: list.map((u) => u.name),
        partner: partner ? partner.name : null,
        err,
      }, null, 2));
    })();
  }, []);

  return <pre style={{ padding: 16, whiteSpace: 'pre-wrap', color: '#000', background: '#fff' }}>{out}</pre>;
}
