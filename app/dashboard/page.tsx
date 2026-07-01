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
    if (!session) { router.replace('/'); return; }
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
        setPartnerEntry(await getEntryByDate(partnerUser.id, todayStr));
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-bg">
        <div className="text-white text-lg">⏳ Yuklanmoqda...</div>
      </div>
    );
  }

  const todayStr = today();
  const myDone = countPrayers(myEntry);
  const myMissed = getMissedPrayers(myEntry);
  const partnerDone = countPrayers(partnerEntry);

  const totalDhikr = myEntry
    ? (myEntry.subhanallah_count || 0) + (myEntry.alhamdulillah_count || 0) +
      (myEntry.allahu_akbar_count || 0) + (myEntry.la_ilaha_count || 0) +
      (myEntry.astaghfirullah_count || 0)
    : 0;

  return (
    <div className="min-h-screen pb-28 page-bg">
      {/* Header */}
      <div className="header-bg text-white px-4 pt-10 pb-20">
        <div className="max-w-md mx-auto flex justify-between items-start">
          <div>
            <p className="text-green-400 text-xs uppercase tracking-widest mb-1">Assalomu alaykum</p>
            <h1 className="text-2xl font-black">{user?.name} ✦</h1>
            <p className="text-green-400 text-xs mt-1">{formatDisplayDate(todayStr)}</p>
          </div>
          <button type="button" onClick={() => { clearSession(); router.push('/'); }}
            className="text-green-400 text-xs border border-green-800 px-3 py-1 rounded-full hover:bg-green-900/50">
            Chiqish
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-12 space-y-4 fade-in">

        {/* My today card */}
        <div className="card p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-gray-800">Bugungi holat</h2>
              <p className="text-xs text-gray-400">{user?.name}</p>
            </div>
            <Link href="/entry"
              className="text-sm font-bold px-4 py-2 rounded-xl text-white btn-entry-link">
              {myEntry ? '✏️ Tahrirlash' : '+ Kiritish'}
            </Link>
          </div>

          {/* Prayers */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {PRAYERS.map((p) => (
              <div key={p.key}
                className={`prayer-btn ${myEntry?.[p.key] ? 'prayer-active' : 'prayer-inactive'}`}>
                <div className="text-xs font-bold leading-tight">{p.label}</div>
                <div className="text-lg mt-1">{myEntry?.[p.key] ? '✓' : '○'}</div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatChip label="Namoz" value={`${myDone}/5`} cls="stat-mini-green" />
            <StatChip label="Zikr" value={totalDhikr > 0 ? totalDhikr.toLocaleString() : (myEntry?.dhikr_count ?? '—')} cls="stat-mini-gold" />
            <StatChip label="Salovat" value={myEntry?.salawat_count ?? '—'} cls="stat-mini-purple" />
          </div>

          {myMissed > 0 && myEntry && (
            <p className="text-xs text-red-500 text-center">⚠️ {myMissed} ta namoz qoldirildi</p>
          )}
          {myDone === 5 && (
            <p className="text-xs text-green-600 text-center font-semibold">🎉 Barcha namozlar o'qildi!</p>
          )}
          {!myEntry && (
            <p className="text-xs text-gray-400 text-center">Bugungi ma'lumot hali kiritilmagan</p>
          )}
        </div>

        {/* Partner card */}
        {partner && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-gray-800">{partner.name}</h2>
                <p className="text-xs text-gray-400">Bugungi holat • faqat ko'rish</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${partnerEntry ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {partnerEntry ? '✓ Kiritilgan' : 'Kutilmoqda'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {PRAYERS.map((p) => (
                <div key={p.key}
                  className={`prayer-btn ${partnerEntry?.[p.key] ? 'prayer-active' : 'prayer-inactive'}`}>
                  <div className="text-xs font-bold leading-tight">{p.label}</div>
                  <div className="text-lg mt-1">{partnerEntry?.[p.key] ? '✓' : '○'}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatChip label="Namoz" value={`${partnerDone}/5`} cls="stat-mini-green" />
              <StatChip label="Zikr" value={partnerEntry?.dhikr_count ?? '—'} cls="stat-mini-gold" />
              <StatChip label="Salovat" value={partnerEntry?.salawat_count ?? '—'} cls="stat-mini-purple" />
            </div>
          </div>
        )}

        {/* Zikr reminder */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-3">📿 Kunlik zikrlar</h3>
          <div className="space-y-1">
            {[
              { label: 'SubhanAlloh', arabic: 'سُبْحَانَ اللَّهِ', n: 33, done: myEntry?.subhanallah_count },
              { label: 'Alhamdulilloh', arabic: 'الْحَمْدُ لِلَّهِ', n: 33, done: myEntry?.alhamdulillah_count },
              { label: 'Allohu Akbar', arabic: 'اللَّهُ أَكْبَرُ', n: 34, done: myEntry?.allahu_akbar_count },
              { label: 'La ilaha illalloh', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', n: 100, done: myEntry?.la_ilaha_count },
              { label: 'Astaghfirulloh', arabic: 'أَسْتَغْفِرُ اللَّهَ', n: 100, done: myEntry?.astaghfirullah_count },
            ].map((d) => (
              <div key={d.label} className="dhikr-row">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{d.label}</p>
                  <p className="dhikr-arabic text-xs">{d.arabic}</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${(d.done || 0) >= d.n ? 'text-green-600' : 'text-gray-400'}`}>
                    {d.done || 0}
                  </span>
                  <span className="text-xs text-gray-300">/{d.n}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kitob o'qish */}
        {(myEntry?.morning_pages || myEntry?.evening_pages) ? (
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-3">📚 Bugungi o&apos;qish</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-amber-700">{myEntry.morning_pages}</div>
                <div className="text-xs text-amber-600 mt-1">🌅 Ertalab</div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-indigo-700">{myEntry.evening_pages}</div>
                <div className="text-xs text-indigo-600 mt-1">🌙 Kechqurun</div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <span className="text-sm font-bold text-gray-700">
                Jami: {(myEntry.morning_pages || 0) + (myEntry.evening_pages || 0)} sahifa
              </span>
              {myEntry.book_name && (
                <p className="text-xs text-gray-400 mt-0.5">📖 {myEntry.book_name}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-700 text-sm">📚 Bugun kitob o&apos;qidingizmi?</p>
              <p className="text-xs text-gray-400">Ertalab & kechqurun sahifalarni kiriting</p>
            </div>
            <a href="/entry" className="text-xs bg-amber-500 text-white px-3 py-2 rounded-xl font-bold">+ Qo&apos;sh</a>
          </div>
        )}

        {/* Hamkor kitob */}
        {partner && (partnerEntry?.morning_pages || partnerEntry?.evening_pages) && (
          <div className="card p-4">
            <p className="font-bold text-gray-800 text-sm mb-2">📚 {partner.name} — bugungi o&apos;qish</p>
            <div className="flex gap-3">
              <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-bold">
                🌅 {partnerEntry?.morning_pages || 0} sahifa
              </span>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold">
                🌙 {partnerEntry?.evening_pages || 0} sahifa
              </span>
              <span className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg font-bold">
                Jami: {(partnerEntry?.morning_pages || 0) + (partnerEntry?.evening_pages || 0)}
              </span>
            </div>
            {partnerEntry?.book_name && (
              <p className="text-xs text-gray-400 mt-2">📖 {partnerEntry.book_name}</p>
            )}
          </div>
        )}

        {/* Salawat */}
        <div className="card-gold p-5 text-center">
          <p className="text-2xl mb-1 gold-arabic">
            اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ
          </p>
          <p className="text-xs text-gray-600">Allohhumma solli ala Muhammad ﷺ</p>
          <p className="text-xs text-gray-400 mt-1">
            Bugun: {myEntry?.salawat_count || 0} marta
          </p>
        </div>

      </div>
      <Navigation />
    </div>
  );
}

function StatChip({ label, value, cls }: { label: string; value: string | number; cls: string }) {
  return (
    <div className={`rounded-xl p-3 text-center ${cls}`}>
      <div className="text-lg font-black">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  );
}
