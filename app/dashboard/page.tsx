'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import {
  getSession, clearSession, today, formatDisplayDate,
  countPrayers, getMissedPrayers, calcStreak, calcBadges,
} from '@/lib/utils';
import { getEntryByDate, getAllUsers, getAllEntries } from '@/lib/supabase';
import { getNiyat, setNiyat, getGoals, getNotifEnabled, setNotifEnabled } from '@/lib/local';
import type { DailyEntry, User } from '@/lib/types';
import { PRAYERS } from '@/lib/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [myEntry, setMyEntry] = useState<DailyEntry | null>(null);
  const [partnerEntry, setPartnerEntry] = useState<DailyEntry | null>(null);
  const [allMyEntries, setAllMyEntries] = useState<DailyEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [niyat, setNiyatState] = useState('');
  const [notifOn, setNotifOn] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [yearMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [partnerLastRefresh, setPartnerLastRefresh] = useState<Date>(new Date());

  // Ref to always access latest partner in the polling interval
  const partnerRef = useRef<User | null>(null);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const todayStr = today();
      const [entry, allUsers, allEntries] = await Promise.all([
        getEntryByDate(userId, todayStr),
        getAllUsers(),
        getAllEntries(userId),
      ]);
      setMyEntry(entry);
      setAllMyEntries(allEntries);
      setStreak(calcStreak(allEntries));

      const partnerUser = allUsers.find((u) => String(u.id) !== String(userId)) || null;
      setPartner(partnerUser);
      partnerRef.current = partnerUser;
      if (partnerUser) {
        setPartnerEntry(await getEntryByDate(String(partnerUser.id), todayStr));
        setPartnerLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setUser(session);
    loadData(session.id);
    setNiyatState(getNiyat(session.id, today()));
    setNotifOn(getNotifEnabled(session.id));
  }, [router, loadData]);

  // Poll partner data every 30 seconds — works on any device/browser
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!partnerRef.current) return;
      try {
        const entry = await getEntryByDate(String(partnerRef.current.id), today());
        setPartnerEntry(entry);
        setPartnerLastRefresh(new Date());
      } catch { /* silent — don't break UI on network error */ }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  function handleNiyatSave(text: string) {
    if (!user) return;
    setNiyatState(text);
    setNiyat(user.id, today(), text);
  }

  async function toggleNotif() {
    if (!user) return;
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Brauzeringiz bildirishnomalarni qo\'llab-quvvatlamaydi.\n\nTavsiya: Android Chrome yoki kompyuter brauzeri ishlatib ko\'ring.');
      return;
    }
    if (notifOn) {
      setNotifEnabled(user.id, false);
      setNotifOn(false);
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      alert('Bildirishnomaga ruxsat berilmadi.\nBrauzer manzil satrida 🔒 belgisini bosing → Bildirishnomalar → Ruxsat bering.');
      return;
    }
    setNotifEnabled(user.id, true);
    setNotifOn(true);
    new Notification('✅ Namoz Tracker', {
      body: 'Namoz vaqti kelganda xabar beriladi!',
      icon: '/favicon.ico',
    });
    scheduleNextPrayer();
  }

  function scheduleNextPrayer() {
    const prayerTimes = [
      { name: 'Bomdod', hour: 5, min: 0 },
      { name: 'Peshin', hour: 13, min: 0 },
      { name: 'Asr', hour: 16, min: 30 },
      { name: "Shom", hour: 19, min: 30 },
      { name: 'Xufton', hour: 21, min: 0 },
    ];
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    for (const p of prayerTimes) {
      const pMins = p.hour * 60 + p.min;
      if (pMins > nowMins) {
        const delay = (pMins - nowMins) * 60 * 1000;
        setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification(`🕌 ${p.name} namozi vaqti!`, {
              body: 'Namoz vaqti keldi. Alloh qabul qilsin!',
              icon: '/favicon.ico',
            });
          }
        }, delay);
        break;
      }
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

  const badges = calcBadges(allMyEntries, streak);
  const earnedBadges = badges.filter((b) => b.earned);

  const goals = getGoals(user?.id || '', yearMonth);
  const monthDhikr = allMyEntries
    .filter((e) => e.date.startsWith(yearMonth))
    .reduce((s, e) => s + (e.dhikr_count || 0) + (e.subhanallah_count || 0) + (e.alhamdulillah_count || 0) + (e.allahu_akbar_count || 0) + (e.la_ilaha_count || 0) + (e.astaghfirullah_count || 0), 0);
  const monthSalawat = allMyEntries
    .filter((e) => e.date.startsWith(yearMonth))
    .reduce((s, e) => s + (e.salawat_count || 0), 0);
  const monthPages = allMyEntries
    .filter((e) => e.date.startsWith(yearMonth))
    .reduce((s, e) => s + (e.morning_pages || 0) + (e.evening_pages || 0), 0);
  const monthNamoz5 = allMyEntries
    .filter((e) => e.date.startsWith(yearMonth) && countPrayers(e) === 5).length;

  return (
    <div className="min-h-screen pb-28 page-bg">
      {/* Header */}
      <div className="header-bg text-white px-4 pt-10 pb-20">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-green-400 text-xs uppercase tracking-widest mb-1">Assalomu alaykum</p>
              <h1 className="text-2xl font-black">{user?.name} ✦</h1>
              <p className="text-green-400 text-xs mt-1">{formatDisplayDate(todayStr)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button type="button" onClick={() => { clearSession(); router.push('/'); }}
                className="text-green-400 text-xs border border-green-800 px-3 py-1 rounded-full hover:bg-green-900/50">
                Chiqish
              </button>
              <button type="button" onClick={toggleNotif}
                className={`text-xs border px-3 py-1.5 rounded-full transition-all ${notifOn ? 'bg-green-700 text-white border-green-600' : 'text-green-400 border-green-800 hover:bg-green-900/50'}`}>
                {notifOn ? '🔔 Yoqlangan' : '🔕 Eslatma'}
              </button>
            </div>
          </div>

          {/* Streak banner */}
          {streak > 0 && (
            <div className="streak-banner">
              <span className="text-lg">🔥</span>
              <span className="font-black">{streak} kunlik streak!</span>
              <span className="text-xs opacity-80">5/5 namoz ketma-ket</span>
            </div>
          )}
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
            <p className="text-xs text-green-600 text-center font-semibold">🎉 Barcha namozlar o&apos;qildi!</p>
          )}
          {!myEntry && (
            <p className="text-xs text-gray-400 text-center">Bugungi ma&apos;lumot hali kiritilmagan</p>
          )}
        </div>

        {/* Kunlik niyat */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-3">📝 Bugungi niyat</h3>
          <textarea
            value={niyat}
            onChange={(e) => handleNiyatSave(e.target.value)}
            placeholder="Bugungi niyatingizni yozing... (faqat siz ko'rasiz)"
            className="niyat-input"
            rows={2}
          />
          {niyat && <p className="text-xs text-green-600 mt-1 text-right">✓ Saqlandi</p>}
        </div>

        {/* Badges & Goals toggles */}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setShowBadges(!showBadges)}
            className="card p-4 text-center hover:shadow-md transition-all">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-sm font-bold text-gray-700">Yutuqlar</div>
            <div className="text-xs text-green-600">{earnedBadges.length}/{badges.length} olindi</div>
          </button>
          <button type="button" onClick={() => setShowGoals(!showGoals)}
            className="card p-4 text-center hover:shadow-md transition-all">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm font-bold text-gray-700">Oylik maqsad</div>
            <div className="text-xs text-blue-600">{monthNamoz5}/{goals.namoz} kun</div>
          </button>
        </div>

        {/* Badges panel */}
        {showBadges && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-4">🏆 Yutuqlar (Badges)</h3>
            <div className="grid grid-cols-1 gap-2">
              {badges.map((b) => (
                <div key={b.id}
                  className={`badge-row ${b.earned ? 'badge-earned' : 'badge-locked'}`}>
                  <span className="text-xl w-8 text-center">{b.earned ? b.icon : '🔒'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${b.earned ? 'text-gray-800' : 'text-gray-400'}`}>{b.name}</p>
                    <p className="text-xs text-gray-400 truncate">{b.desc}</p>
                  </div>
                  {b.earned && <span className="text-green-500 text-xs font-bold flex-shrink-0">✓ Olindi</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals panel */}
        {showGoals && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-4">🎯 Oylik maqsad ({yearMonth})</h3>
            <div className="space-y-3">
              <GoalRow label="🕌 5/5 Namoz kunlar" current={monthNamoz5} target={goals.namoz} unit="kun" color="green" />
              <GoalRow label="📿 Zikr" current={monthDhikr} target={goals.dhikr} unit="" color="teal" />
              <GoalRow label="💚 Salovat" current={monthSalawat} target={goals.salawat} unit="" color="emerald" />
              <GoalRow label="📚 Sahifalar" current={monthPages} target={goals.pages} unit="sahifa" color="amber" />
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">Maqsadlarni &quot;Qur&apos;on&quot; sahifasida o&apos;zgartiring</p>
          </div>
        )}

        {/* Partner card — live status */}
        {partner && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-1">
              <div>
                <h2 className="font-bold text-gray-800">{partner.name}</h2>
                <PartnerActivity entry={partnerEntry} />
              </div>
              <div className="text-right">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${partnerEntry ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {partnerEntry ? '✓ Kiritilgan' : 'Kiritilmagan'}
                </span>
                <p className="text-xs text-gray-300 mt-1 pr-1">
                  {partnerLastRefresh.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} da yangilandi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-4 mt-4">
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

            <p className="text-xs text-gray-300 text-center mt-3">
              🔄 Har 30 soniyada avtomatik yangilanadi
            </p>
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
            <Link href="/entry" className="text-xs bg-amber-500 text-white px-3 py-2 rounded-xl font-bold">+ Qo&apos;sh</Link>
          </div>
        )}

        {/* Partner kitob */}
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

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/quran"
            className="card p-4 text-center hover:shadow-md transition-all no-underline block">
            <div className="text-2xl mb-1">📖</div>
            <div className="text-sm font-bold text-gray-700">Qur&apos;on & Duolar</div>
            <div className="text-xs text-gray-400">Suralari • Azkorlar</div>
          </Link>
          <Link href="/statistics"
            className="card p-4 text-center hover:shadow-md transition-all no-underline block">
            <div className="text-2xl mb-1">📅</div>
            <div className="text-sm font-bold text-gray-700">Kalendar</div>
            <div className="text-xs text-gray-400">90 kunlik jadval</div>
          </Link>
        </div>

      </div>
      <Navigation />
    </div>
  );
}

function PartnerActivity({ entry }: { entry: DailyEntry | null }) {
  const [, setTick] = useState(0);

  // Re-render every 30s so the "X daqiqa avval" text stays fresh
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!entry?.updated_at) {
    return <p className="text-xs text-gray-400">⚪ Hali kiritilmagan</p>;
  }

  const diffMs = Date.now() - new Date(entry.updated_at).getTime();
  const mins = Math.floor(diffMs / 60_000);

  if (mins < 3) {
    return (
      <p className="text-xs text-green-500 flex items-center gap-1">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Hozirgina faol
      </p>
    );
  }
  if (mins < 60) {
    return <p className="text-xs text-yellow-600">🟡 {mins} daqiqa avval faol</p>;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return <p className="text-xs text-orange-500">🟠 {hrs} soat avval faol</p>;
  }
  return <p className="text-xs text-gray-400">⚪ Bugun kiritilmagan</p>;
}

function StatChip({ label, value, cls }: { label: string; value: string | number; cls: string }) {
  return (
    <div className={`rounded-xl p-3 text-center ${cls}`}>
      <div className="text-lg font-black">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  );
}

function GoalFill({ pct, color }: { pct: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.style.setProperty('--goal-width', `${pct}%`);
  }, [pct]);
  return <div className={`goal-fill goal-fill-${color}`} ref={ref} />;
}

function GoalRow({ label, current, target, unit, color }: {
  label: string; current: number; target: number; unit: string; color: string;
}) {
  const pct = Math.min(100, target > 0 ? Math.round((current / target) * 100) : 0);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-bold text-gray-800">{current.toLocaleString()}/{target.toLocaleString()} {unit} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <GoalFill pct={pct} color={color} />
      </div>
    </div>
  );
}
