'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import Navigation from '@/components/Navigation';
import { getSession, today, getMonthRange, getYearRange, buildChartData, calcTotals, formatDisplayDate } from '@/lib/utils';
import { getEntriesByRange, getAllUsers } from '@/lib/supabase';
import type { DailyEntry, User } from '@/lib/types';
import { format, subDays } from 'date-fns';

type Period = 'week' | 'month' | 'year';

function calcBookTotals(entries: DailyEntry[]) {
  const totalMorning = entries.reduce((s, e) => s + (e.morning_pages || 0), 0);
  const totalEvening = entries.reduce((s, e) => s + (e.evening_pages || 0), 0);
  const totalPages = totalMorning + totalEvening;
  const daysRead = entries.filter((e) => (e.morning_pages || 0) + (e.evening_pages || 0) > 0).length;
  const lastBook = entries.find((e) => e.book_name)?.book_name || '';
  return { totalMorning, totalEvening, totalPages, daysRead, lastBook };
}

export default function StatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [myEntries, setMyEntries] = useState<DailyEntry[]>([]);
  const [partnerEntries, setPartnerEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setUser(session);
    loadAll(session.id, period);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadAll(user.id, period);
  }, [period, user]);

  async function loadAll(userId: string, p: Period) {
    setLoading(true);
    try {
      const { start, end } = getRange(p);
      const [me, allUsers] = await Promise.all([
        getEntriesByRange(userId, start, end),
        getAllUsers(),
      ]);
      setMyEntries(me);
      const partnerUser = allUsers.find((u) => u.id !== userId) || null;
      setPartner(partnerUser);
      if (partnerUser) {
        setPartnerEntries(await getEntriesByRange(partnerUser.id, start, end));
      }
    } finally {
      setLoading(false);
    }
  }

  function getRange(p: Period): { start: string; end: string } {
    const todayStr = today();
    if (p === 'week') return { start: format(subDays(new Date(), 6), 'yyyy-MM-dd'), end: todayStr };
    if (p === 'month') return getMonthRange();
    return getYearRange();
  }

  const { start, end } = getRange(period);
  const myChart = buildChartData(myEntries, start, end);
  const partnerChart = buildChartData(partnerEntries, start, end);
  const myTotals = calcTotals(myEntries);
  const partnerTotals = calcTotals(partnerEntries);
  const myBook = calcBookTotals(myEntries);
  const partnerBook = calcBookTotals(partnerEntries);

  const interval = period === 'year' ? 29 : period === 'month' ? 6 : 0;

  // Namoz comparison
  const namozChart = myChart.map((d, i) => ({
    date: d.date,
    [user?.name || '']: d.namoz,
    [partner?.name || 'Hamkor']: partnerChart[i]?.namoz || 0,
  }));

  // Book comparison chart
  const bookChart = myChart.map((d, i) => {
    const myE = myEntries.find((e) => e.date === d.fullDate);
    const pE = partnerEntries.find((e) => e.date === d.fullDate);
    return {
      date: d.date,
      [user?.name || '']: (myE?.morning_pages || 0) + (myE?.evening_pages || 0),
      [partner?.name || 'Hamkor']: (pE?.morning_pages || 0) + (pE?.evening_pages || 0),
    };
  });

  return (
    <div className="min-h-screen pb-28 page-bg">
      <div className="header-bg text-white px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black">📊 Statistika</h1>
          <p className="text-green-400 text-xs mt-1 uppercase tracking-widest">Umumiy ko&apos;rsatkichlar</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4 fade-in">

        {/* Period selector */}
        <div className="card p-2 flex gap-1">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button type="button" key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                period === p ? 'bg-green-800 text-white shadow' : 'text-gray-400'
              }`}>
              {p === 'week' ? '7 kun' : p === 'month' ? 'Oy' : 'Yil'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-10 text-center text-gray-400">⏳ Yuklanmoqda...</div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard name={user?.name || ''} totals={myTotals} book={myBook} />
              {partner && <SummaryCard name={partner.name} totals={partnerTotals} book={partnerBook} />}
            </div>

            {/* Namoz chart */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-4">🕌 Namoz taqqoslash</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={namozChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={interval} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey={user?.name || ''} fill="#1a6b3c" radius={[4, 4, 0, 0]} />
                  {partner && <Bar dataKey={partner.name} fill="#d4a017" radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Book reading comparison */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-1">📚 Kitob o&apos;qish taqqoslash</h3>
              <p className="text-xs text-gray-400 mb-4">Kunlik sahifalar soni</p>

              {/* Book totals */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-amber-600 font-semibold mb-1">{user?.name}</p>
                  <p className="text-2xl font-black text-amber-700">{myBook.totalPages}</p>
                  <p className="text-xs text-amber-500">sahifa</p>
                  {myBook.lastBook && <p className="text-xs text-amber-400 mt-1 truncate">📖 {myBook.lastBook}</p>}
                </div>
                {partner && (
                  <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-indigo-600 font-semibold mb-1">{partner.name}</p>
                    <p className="text-2xl font-black text-indigo-700">{partnerBook.totalPages}</p>
                    <p className="text-xs text-indigo-500">sahifa</p>
                    {partnerBook.lastBook && <p className="text-xs text-indigo-400 mt-1 truncate">📖 {partnerBook.lastBook}</p>}
                  </div>
                )}
              </div>

              {/* Who's winning */}
              {partner && (
                <div className="bg-gray-50 rounded-xl p-3 text-center mb-4">
                  {myBook.totalPages > partnerBook.totalPages ? (
                    <p className="text-sm font-bold text-green-700">
                      🏆 {user?.name} ko&apos;proq o&apos;qidi! (+{myBook.totalPages - partnerBook.totalPages} sahifa)
                    </p>
                  ) : partnerBook.totalPages > myBook.totalPages ? (
                    <p className="text-sm font-bold text-indigo-700">
                      🏆 {partner.name} ko&apos;proq o&apos;qidi! (+{partnerBook.totalPages - myBook.totalPages} sahifa)
                    </p>
                  ) : myBook.totalPages > 0 ? (
                    <p className="text-sm font-bold text-gray-600">🤝 Tengma-teng!</p>
                  ) : (
                    <p className="text-xs text-gray-400">Hali ma&apos;lumot yo&apos;q</p>
                  )}
                </div>
              )}

              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={bookChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={interval} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey={user?.name || ''} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  {partner && <Bar dataKey={partner.name} fill="#6366f1" radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Zikr & Salovat */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-1">📿 Zikr & Salovat</h3>
              <p className="text-xs text-gray-400 mb-4">{user?.name} — kunlik miqdor</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={myChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={interval} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="dhikr" stroke="#1a6b3c" strokeWidth={2} dot={false} name="Zikr" />
                  <Line type="monotone" dataKey="salawat" stroke="#d4a017" strokeWidth={2} dot={false} name="Salovat" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {partner && (
              <div className="card p-5">
                <h3 className="font-bold text-gray-800 mb-1">📿 Zikr & Salovat</h3>
                <p className="text-xs text-gray-400 mb-4">{partner.name} — kunlik miqdor</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={partnerChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={interval} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="dhikr" stroke="#1a6b3c" strokeWidth={2} dot={false} name="Zikr" />
                    <Line type="monotone" dataKey="salawat" stroke="#d4a017" strokeWidth={2} dot={false} name="Salovat" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 pb-2">
              {formatDisplayDate(start)} — {formatDisplayDate(end)}
            </p>
          </>
        )}
      </div>
      <Navigation />
    </div>
  );
}

type BookTotals = ReturnType<typeof calcBookTotals>;

function SummaryCard({ name, totals, book }: {
  name: string;
  totals: ReturnType<typeof calcTotals>;
  book: BookTotals;
}) {
  return (
    <div className="card p-4">
      <p className="font-black text-gray-800 text-sm mb-3 truncate">{name}</p>
      <div className="space-y-1.5">
        <Row label="🕌 Namoz" value={`${totals.totalNamoz} ta`} />
        <Row label="⚠️ Qoldirilgan" value={`${totals.totalMissed} ta`} red />
        <Row label="📿 Zikr" value={totals.totalDhikr.toLocaleString()} />
        <Row label="💚 Salovat" value={totals.totalSalawat.toLocaleString()} />
        <Row label="📚 Sahifalar" value={`${book.totalPages}`} amber />
        <Row label="📅 O'qigan kun" value={`${book.daysRead}`} />
        <div className="pt-1">
          <div className="text-xs text-gray-400 mb-1">
            Namoz: {totals.avgNamoz.toFixed(0)}%
          </div>
          <div className="progress-bar">
            <div className="progress-fill"
              style={{ '--progress-width': `${totals.avgNamoz}%` } as React.CSSProperties} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, red, amber }: { label: string; value: string; red?: boolean; amber?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${red ? 'text-red-500' : amber ? 'text-amber-600' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
}
