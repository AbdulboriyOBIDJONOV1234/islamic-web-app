'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSession, today, formatDisplayDate, countPrayers, getMissedPrayers } from '@/lib/utils';
import { getEntryByDate, getAllUsers, getAllEntries } from '@/lib/supabase';
import type { DailyEntry, User } from '@/lib/types';
import { PRAYERS } from '@/lib/types';

export default function PartnerPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setUser(session);
    loadData(session.id);
  }, [router]);

  async function loadData(myId: string) {
    setLoading(true);
    setError('');
    try {
      const allUsers = await getAllUsers();
      const partnerUser = allUsers.find((u) => String(u.id) !== String(myId)) || null;
      setPartner(partnerUser);
      if (partnerUser) {
        const pid = String(partnerUser.id);
        const [todayEnt, entries] = await Promise.all([
          getEntryByDate(pid, today()),
          getAllEntries(pid),
        ]);
        setTodayEntry(todayEnt);
        const safeEntries = Array.isArray(entries) ? entries : [];
        setAllEntries(safeEntries.slice(0, 30));
      }
    } catch (err) {
      console.error('Partner page load error:', err);
      setError(err instanceof Error ? err.message : 'Ma\'lumotlarni yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-bg">
        <div className="text-white text-xl">⏳ Yuklanmoqda...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen page-bg pb-28">
        <div className="header-bg text-white px-4 pt-10 pb-16">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold">👤 Hamkor</h1>
          </div>
        </div>
        <div className="max-w-md mx-auto px-4 -mt-8">
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-500 font-semibold mb-3">{error}</p>
            <button type="button" onClick={() => user && loadData(user.id)}
              className="btn-primary">Qayta urinish</button>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen page-bg pb-28">
        <div className="header-bg text-white px-4 pt-10 pb-16">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold">👤 Hamkor</h1>
            <p className="text-green-400 text-xs mt-1 uppercase tracking-widest">Faqat ko&apos;rish</p>
          </div>
        </div>
        <div className="max-w-md mx-auto px-4 -mt-8">
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🌙</div>
            <h2 className="font-bold text-gray-700 text-lg mb-2">Hamkor hali yo&apos;q</h2>
            <p className="text-gray-400 text-sm">
              Ikkinchi kishi ro&apos;yxatdan o&apos;tishi kutilmoqda
            </p>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  const prayersDone = countPrayers(todayEntry);
  const prayersMissed = getMissedPrayers(todayEntry);

  return (
    <div className="min-h-screen page-bg pb-28">
      <div className="header-bg text-white px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto">
          <p className="text-green-400 text-xs uppercase tracking-widest mb-1">Hamkoringiz</p>
          <h1 className="text-2xl font-black">{partner.name} 👤</h1>
          <p className="text-green-400 text-xs mt-1">
            Faqat ko&apos;rish mumkin • Tahrirlash cheklangan
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4 fade-in">
        {/* Today */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800">Bugun — {formatDisplayDate(today())}</h2>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
              todayEntry ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
            }`}>
              {todayEntry ? 'Kiritilgan ✓' : 'Kiritilmagan'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {PRAYERS.map((p) => {
              const done = todayEntry ? todayEntry[p.key] : false;
              return (
                <div key={p.key} className={`prayer-btn ${done ? 'prayer-active' : 'prayer-inactive'}`}>
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-xl mt-1">{done ? '✓' : '○'}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Namoz" value={`${prayersDone}/5`} />
            <StatBox label="Zikr" value={todayEntry?.dhikr_count ?? '—'} />
            <StatBox label="Salovat" value={todayEntry?.salawat_count ?? '—'} />
          </div>

          {prayersMissed > 0 && todayEntry && (
            <p className="mt-3 text-xs text-red-500 text-center">⚠️ {prayersMissed} ta namoz qoldirildi</p>
          )}
          {prayersDone === 5 && (
            <p className="mt-3 text-xs text-green-600 text-center font-semibold">🎉 Barcha namozlar o&apos;qildi!</p>
          )}
        </div>

        {/* Today dhikr & book */}
        {todayEntry && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-3">📿 Bugungi zikrlar</h3>
            <div className="space-y-1">
              {[
                { label: 'SubhanAlloh', n: 33, done: todayEntry.subhanallah_count },
                { label: 'Alhamdulilloh', n: 33, done: todayEntry.alhamdulillah_count },
                { label: 'Allohu Akbar', n: 33, done: todayEntry.allahu_akbar_count },
                { label: 'La ilaha illalloh', n: 100, done: todayEntry.la_ilaha_count },
                { label: 'Astaghfirulloh', n: 100, done: todayEntry.astaghfirullah_count },
              ].map((d) => (
                <div key={d.label} className="dhikr-row">
                  <span className="flex-1 text-sm text-gray-700">{d.label}</span>
                  <span className={`text-sm font-bold ${(d.done || 0) >= d.n ? 'text-green-600' : 'text-gray-400'}`}>
                    {d.done || 0}<span className="text-gray-300 font-normal">/{d.n}</span>
                  </span>
                </div>
              ))}
            </div>
            {(todayEntry.morning_pages || todayEntry.evening_pages) ? (
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                <StatBox label="🌅 Ertalab" value={todayEntry.morning_pages || 0} />
                <StatBox label="🌙 Kechqurun" value={todayEntry.evening_pages || 0} />
                <StatBox label="📚 Jami" value={(todayEntry.morning_pages || 0) + (todayEntry.evening_pages || 0)} />
              </div>
            ) : null}
          </div>
        )}

        {/* History */}
        {allEntries.length > 0 && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-4">📋 So&apos;nggi 30 kun</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allEntries.map((entry) => {
                const done = countPrayers(entry);
                const missed = getMissedPrayers(entry);
                const totalDhikr = (entry.subhanallah_count || 0) + (entry.alhamdulillah_count || 0) +
                  (entry.allahu_akbar_count || 0) + (entry.la_ilaha_count || 0) + (entry.astaghfirullah_count || 0);
                return (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{formatDisplayDate(entry.date)}</p>
                      <p className="text-xs text-gray-400">
                        Zikr: {totalDhikr > 0 ? totalDhikr.toLocaleString() : entry.dhikr_count || 0} · Salovat: {entry.salawat_count || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${done === 5 ? 'text-green-600' : missed > 2 ? 'text-red-500' : 'text-orange-500'}`}>
                        {done}/5
                      </span>
                      {done === 5 && <p className="text-xs text-green-500">✓ Barcha</p>}
                      {missed > 0 && <p className="text-xs text-red-400">{missed} qoldirildi</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allEntries.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-gray-400 text-sm">Hali ma&apos;lumot yo&apos;q</p>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
