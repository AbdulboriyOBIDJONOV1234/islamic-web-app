'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { getSession, clearSession, today, formatDisplayDate, countPrayers, getMissedPrayers } from '@/lib/utils';
import { getEntryByDate, getAllUsers } from '@/lib/supabase';
import type { DailyEntry, User } from '@/lib/types';
import { PRAYERS } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [myEntry, setMyEntry] = useState<DailyEntry | null>(null);
  const [partnerEntry, setPartnerEntry] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/');
      return;
    }
    setUser(session);
    loadData(session.id);
  }, [router]);

  async function loadData(userId: string) {
    setLoading(true);
    try {
      const todayStr = today();
      const [entry, allUsers] = await Promise.all([
        getEntryByDate(userId, todayStr),
        getAllUsers(),
      ]);
      setMyEntry(entry);

      const partnerUser = allUsers.find((u) => u.id !== userId) || null;
      setPartner(partnerUser);

      if (partnerUser) {
        const pEntry = await getEntryByDate(partnerUser.id, todayStr);
        setPartnerEntry(pEntry);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-bg">
        <div className="text-white text-xl">⏳ Yuklanmoqda...</div>
      </div>
    );
  }

  const todayStr = today();
  const prayersDone = countPrayers(myEntry);
  const prayersMissed = getMissedPrayers(myEntry);
  const partnerDone = countPrayers(partnerEntry);
  const partnerMissed = getMissedPrayers(partnerEntry);

  return (
    <div className="min-h-screen pb-24 entry-bg">
      {/* Header */}
      <div className="login-bg text-white px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto flex justify-between items-start">
          <div>
            <p className="text-green-200 text-sm">Assalomu alaykum,</p>
            <h1 className="text-2xl font-bold">{user?.name} 👋</h1>
            <p className="text-green-200 text-xs mt-1">{formatDisplayDate(todayStr)}</p>
          </div>
          <button type="button" onClick={handleLogout} className="text-green-200 text-sm underline">
            Chiqish
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4 fade-in">
        {/* Today's entry card */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800">Bugungi holat</h2>
            <Link href="/entry" className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
              {myEntry ? 'Tahrirlash' : '+ Kiritish'}
            </Link>
          </div>

          {/* Prayer row */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {PRAYERS.map((p) => {
              const done = myEntry ? myEntry[p.key] : false;
              return (
                <div
                  key={p.key}
                  className={`prayer-btn ${done ? 'prayer-active' : 'prayer-inactive'}`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-lg mt-1">{done ? '✓' : '○'}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Namoz" value={`${prayersDone}/5`} color="green" />
            <StatMini label="Zikr" value={myEntry?.dhikr_count ?? '—'} color="blue" />
            <StatMini label="Salovat" value={myEntry?.salawat_count ?? '—'} color="purple" />
          </div>

          {prayersMissed > 0 && myEntry && (
            <p className="mt-3 text-xs text-red-500 text-center">
              ⚠️ {prayersMissed} ta namoz qoldirildi
            </p>
          )}
          {!myEntry && (
            <p className="mt-3 text-xs text-gray-400 text-center">
              Bugungi ma&apos;lumotlar hali kiritilmagan
            </p>
          )}
        </div>

        {/* Partner card */}
        {partner && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-4">
              {partner.name} — bugun
            </h2>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {PRAYERS.map((p) => {
                const done = partnerEntry ? partnerEntry[p.key] : false;
                return (
                  <div
                    key={p.key}
                    className={`prayer-btn ${done ? 'prayer-active' : 'prayer-inactive'}`}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className="text-lg mt-1">{done ? '✓' : '○'}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatMini label="Namoz" value={`${partnerDone}/5`} color="green" />
              <StatMini label="Zikr" value={partnerEntry?.dhikr_count ?? '—'} color="blue" />
              <StatMini label="Salovat" value={partnerEntry?.salawat_count ?? '—'} color="purple" />
            </div>

            {!partnerEntry && (
              <p className="mt-3 text-xs text-gray-400 text-center">
                {partner.name} hali bugungi ma&apos;lumot kiritmagan
              </p>
            )}
          </div>
        )}

        {/* Quick dhikr reminder */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 mb-3">📿 Kunlik zikrlar</h3>
          <div className="space-y-2">
            {[
              { text: 'SubhanAlloh', count: 33, arabic: 'سُبْحَانَ اللَّهِ' },
              { text: 'Alhamdulilloh', count: 33, arabic: 'الْحَمْدُ لِلَّهِ' },
              { text: 'Allohu Akbar', count: 34, arabic: 'اللَّهُ أَكْبَرُ' },
            ].map((d) => (
              <div key={d.text} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{d.text}</p>
                  <p className="text-xs text-gray-400 arabic-text">{d.arabic}</p>
                </div>
                <span className="text-xs bg-green-50 text-green-700 font-bold px-2 py-1 rounded-full">
                  ×{d.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Salovat reminder */}
        <div className="card p-5 text-center">
          <p className="text-green-800 font-medium arabic-text text-xl mb-2">
            اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ
          </p>
          <p className="text-xs text-gray-500">Allohhumma solli ala Muhammad ﷺ</p>
          <p className="text-xs text-gray-400 mt-1">Kuniga kamida 100 marta</p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-800',
    blue: 'bg-blue-50 text-blue-800',
    purple: 'bg-purple-50 text-purple-800',
  };
  return (
    <div className={`rounded-xl p-3 text-center ${colors[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-70">{label}</div>
    </div>
  );
}
