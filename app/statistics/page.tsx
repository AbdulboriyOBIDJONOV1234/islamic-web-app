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
        const pEntries = await getEntriesByRange(partnerUser.id, start, end);
        setPartnerEntries(pEntries);
      }
    } finally {
      setLoading(false);
    }
  }

  function getRange(p: Period): { start: string; end: string } {
    const todayStr = today();
    if (p === 'week') {
      return { start: format(subDays(new Date(), 6), 'yyyy-MM-dd'), end: todayStr };
    }
    if (p === 'month') return getMonthRange();
    return getYearRange();
  }

  const { start, end } = getRange(period);
  const myChart = buildChartData(myEntries, start, end);
  const partnerChart = buildChartData(partnerEntries, start, end);

  const myTotals = calcTotals(myEntries);
  const partnerTotals = calcTotals(partnerEntries);

  // Combined chart data for comparison
  const combinedChart = myChart.map((d, i) => ({
    date: d.date,
    [`${user?.name}`]: d.namoz,
    [`${partner?.name || 'Hamkor'}`]: partnerChart[i]?.namoz || 0,
  }));

  return (
    <div className="min-h-screen pb-28 entry-bg">
      <div className="login-bg text-white px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold">📊 Statistika</h1>
          <p className="text-green-200 text-xs mt-1">Umumiy ko&apos;rsatkichlar</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4 fade-in">
        {/* Period selector */}
        <div className="card p-2 flex gap-2">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                period === p ? 'bg-green-700 text-white' : 'text-gray-500'
              }`}
            >
              {p === 'week' ? '7 kun' : p === 'month' ? 'Oy' : 'Yil'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-10 text-center text-gray-400">Yuklanmoqda...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard name={user?.name || ''} totals={myTotals} />
              {partner && <SummaryCard name={partner.name} totals={partnerTotals} />}
            </div>

            {/* Namoz comparison chart */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-4">🕌 Namoz taqqoslash</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={combinedChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={period === 'year' ? 29 : period === 'month' ? 6 : 0} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey={user?.name || ''} fill="#1a6b3c" radius={[4, 4, 0, 0]} />
                  {partner && (
                    <Bar dataKey={partner.name} fill="#d4a017" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* My dhikr/salawat chart */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-1">📿 {user?.name} — Zikr & Salovat</h3>
              <p className="text-xs text-gray-400 mb-4">Kunlik miqdor</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={myChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={period === 'year' ? 29 : period === 'month' ? 6 : 0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="dhikr" stroke="#1a6b3c" strokeWidth={2} dot={false} name="Zikr" />
                  <Line type="monotone" dataKey="salawat" stroke="#d4a017" strokeWidth={2} dot={false} name="Salovat" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Partner dhikr/salawat */}
            {partner && (
              <div className="card p-5">
                <h3 className="font-bold text-gray-800 mb-1">📿 {partner.name} — Zikr & Salovat</h3>
                <p className="text-xs text-gray-400 mb-4">Kunlik miqdor</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={partnerChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={period === 'year' ? 29 : period === 'month' ? 6 : 0} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="dhikr" stroke="#1a6b3c" strokeWidth={2} dot={false} name="Zikr" />
                    <Line type="monotone" dataKey="salawat" stroke="#d4a017" strokeWidth={2} dot={false} name="Salovat" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Range info */}
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

function SummaryCard({ name, totals }: { name: string; totals: ReturnType<typeof calcTotals> }) {
  return (
    <div className="card p-4">
      <p className="font-bold text-gray-800 text-sm mb-3 truncate">{name}</p>
      <div className="space-y-2">
        <Row label="Namoz" value={`${totals.totalNamoz} ta`} />
        <Row label="Qoldirilgan" value={`${totals.totalMissed} ta`} red />
        <Row label="Zikr" value={totals.totalDhikr.toLocaleString()} />
        <Row label="Salovat" value={totals.totalSalawat.toLocaleString()} />
        <div className="pt-1">
          <div className="text-xs text-gray-400 mb-1">
            O&apos;qilgan: {totals.avgNamoz.toFixed(0)}%
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ '--progress-width': `${totals.avgNamoz}%` } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, red }: { label: string; value: string; red?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${red ? 'text-red-500' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
