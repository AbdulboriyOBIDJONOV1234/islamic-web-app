'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSession, today, calcStreak, formatDisplayDate } from '@/lib/utils';
import { getEntryByDate, getAllUsers, getAllEntries } from '@/lib/supabase';
import { getDuaChecklist } from '@/lib/local';
import { MORNING_DUAS, EVENING_DUAS } from '@/lib/dua-data';
import {
  computeDailyAwards,
  computeCumulativeAwards,
  computeDayScore,
  getScoreLevel,
  getAwardHistory,
  updateAwardHistory,
  getTodayQuote,
  type DailyAward,
  type CumulativeAward,
} from '@/lib/awards';
import type { DailyEntry, User } from '@/lib/types';

const COLOR_MAP: Record<string, string> = {
  green:   'bg-green-50 border-green-300 text-green-700',
  teal:    'bg-teal-50 border-teal-300 text-teal-700',
  blue:    'bg-blue-50 border-blue-300 text-blue-700',
  emerald: 'bg-emerald-50 border-emerald-300 text-emerald-700',
  amber:   'bg-amber-50 border-amber-300 text-amber-700',
  orange:  'bg-orange-50 border-orange-300 text-orange-700',
  indigo:  'bg-indigo-50 border-indigo-300 text-indigo-700',
  gold:    'bg-yellow-50 border-yellow-300 text-yellow-700',
};

export default function MukofotlarPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [partner, setPartner] = useState<User | null>(null);

  const [myEntry, setMyEntry] = useState<DailyEntry | null>(null);
  const [partnerEntry, setPartnerEntry] = useState<DailyEntry | null>(null);

  const [myEntries, setMyEntries] = useState<DailyEntry[]>([]);
  const [partnerEntries, setPartnerEntries] = useState<DailyEntry[]>([]);

  const [myMorningDone, setMyMorningDone] = useState<number[]>([]);
  const [myEveningDone, setMyEveningDone] = useState<number[]>([]);

  const [myAwardHistory, setMyAwardHistory] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const todayStr = today();
  const quote = getTodayQuote(todayStr);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const [myEnt, allUsers, myEnts] = await Promise.all([
        getEntryByDate(userId, todayStr),
        getAllUsers(),
        getAllEntries(userId),
      ]);
      setMyEntry(myEnt);
      setMyEntries(Array.isArray(myEnts) ? myEnts : []);

      const partnerUser = allUsers.find((u) => String(u.id) !== String(userId)) || null;
      setPartner(partnerUser);

      if (partnerUser) {
        const [pEnt, pEnts] = await Promise.all([
          getEntryByDate(String(partnerUser.id), todayStr),
          getAllEntries(String(partnerUser.id)),
        ]);
        setPartnerEntry(pEnt);
        setPartnerEntries(Array.isArray(pEnts) ? pEnts : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setUser(session);

    const dc = getDuaChecklist(session.id, todayStr);
    setMyMorningDone(dc.morning);
    setMyEveningDone(dc.evening);

    const history = getAwardHistory(session.id);
    setMyAwardHistory(history);

    loadData(session.id);
  }, [router, loadData, todayStr]);

  // After data loads, update cumulative award history in localStorage
  useEffect(() => {
    if (!user || myEntries.length === 0) return;
    const streak = calcStreak(myEntries);
    const cumulative = computeCumulativeAwards(myEntries, streak);
    updateAwardHistory(user.id, cumulative, todayStr);
    setMyAwardHistory(getAwardHistory(user.id));
  }, [user, myEntries, todayStr]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-bg">
        <div className="text-white">⏳ Yuklanmoqda...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen page-bg pb-28">
        <div className="header-bg text-white px-4 pt-10 pb-16">
          <div className="max-w-md mx-auto"><h1 className="text-2xl font-black">🏆 Mukofotlar</h1></div>
        </div>
        <div className="max-w-md mx-auto px-4 -mt-8">
          <div className="card p-8 text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button type="button" onClick={() => user && loadData(user.id)} className="btn-primary">Qayta urinish</button>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  const myScore = computeDayScore(myEntry);
  const partnerScore = partner ? computeDayScore(partnerEntry) : 0;
  const myLevel = getScoreLevel(myScore);
  const partnerLevel = getScoreLevel(partnerScore);

  const myStreak = calcStreak(myEntries);
  const partnerStreak = partner ? calcStreak(partnerEntries) : 0;

  const myDailyAwards = computeDailyAwards(
    myEntry, myMorningDone, myEveningDone, MORNING_DUAS.length, EVENING_DUAS.length,
  );
  const partnerDailyAwards = partner
    ? computeDailyAwards(partnerEntry, [], [], 0, 0)
    : [];

  const myCumulative = computeCumulativeAwards(myEntries, myStreak);
  const partnerCumulative = partner ? computeCumulativeAwards(partnerEntries, partnerStreak) : [];

  const myEarnedToday = myDailyAwards.filter((a) => a.earned);
  const partnerEarnedToday = partnerDailyAwards.filter((a) => a.earned);
  const myTodayPoints = myEarnedToday.reduce((s, a) => s + a.points, 0);
  const partnerTodayPoints = partnerEarnedToday.reduce((s, a) => s + a.points, 0);

  const bothDid5Namoz = myEntry &&
    [myEntry.bomdod, myEntry.peshin, myEntry.asr, myEntry.shom, myEntry.xufton].filter(Boolean).length === 5 &&
    partnerEntry &&
    [partnerEntry.bomdod, partnerEntry.peshin, partnerEntry.asr, partnerEntry.shom, partnerEntry.xufton].filter(Boolean).length === 5;

  const total = myScore + partnerScore;
  const myPct = total > 0 ? Math.round((myScore / total) * 100) : 50;

  const myEarnedCumul = myCumulative.filter((a) => a.earned).length;
  const partnerEarnedCumul = partnerCumulative.filter((a) => a.earned).length;

  return (
    <div className="min-h-screen pb-28 page-bg">
      {/* Header */}
      <div className="header-bg text-white px-4 pt-10 pb-20">
        <div className="max-w-md mx-auto">
          <p className="text-green-400 text-xs uppercase tracking-widest mb-1">Bugun — {formatDisplayDate(todayStr)}</p>
          <h1 className="text-2xl font-black">🏆 Mukofotlar</h1>
          <p className="text-green-400 text-xs mt-1">Kunlik ball · Rekordlar · Yutuqlar</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-12 space-y-4 fade-in">

        {/* ── TODAY SCORES ── */}
        <div className="card p-5 shadow-xl">
          <h2 className="font-black text-gray-800 mb-4">📊 Bugungi natija</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <ScoreCard
              name={user?.name || ''}
              score={myScore}
              level={myLevel}
              earnedCount={myEarnedToday.length}
              streak={myStreak}
              isMe
            />
            {partner ? (
              <ScoreCard
                name={partner.name}
                score={partnerScore}
                level={partnerLevel}
                earnedCount={partnerEarnedToday.length}
                streak={partnerStreak}
              />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 flex items-center justify-center">
                <p className="text-xs text-gray-400 text-center">Hamkor hali qo&apos;shilmagan</p>
              </div>
            )}
          </div>

          {/* Score bar comparison */}
          {partner && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="font-bold">{user?.name} ({myScore} ball)</span>
                <span className="font-bold">{partner.name} ({partnerScore} ball)</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
                <div
                  className="h-full bg-green-500 transition-all duration-700 rounded-l-full"
                  style={{ width: `${myPct}%` }}
                />
                <div
                  className="h-full bg-purple-400 transition-all duration-700 rounded-r-full"
                  style={{ width: `${100 - myPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Shared award */}
          {bothDid5Namoz && (
            <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl flex items-center gap-3">
              <span className="text-3xl">🤝</span>
              <div>
                <p className="text-sm font-black text-green-800">Birga 5 Namoz!</p>
                <p className="text-xs text-green-600">Ikkalangiz ham bugun 5/5 namoz o&apos;qidingiz — MashaAlloh!</p>
              </div>
            </div>
          )}

          {/* Who's leading */}
          {partner && myScore !== partnerScore && (
            <p className="text-center text-xs text-gray-500 mt-2">
              {myScore > partnerScore
                ? `${user?.name} bugun ${myScore - partnerScore} ball oldinda 🔝`
                : `${partner.name} bugun ${partnerScore - myScore} ball oldinda 🔝`}
            </p>
          )}
        </div>

        {/* ── MY DAILY AWARDS ── */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black text-gray-800">🎯 Mening bugungi mukofotlarim</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
              {myEarnedToday.length}/{myDailyAwards.length} · {myTodayPoints} ball
            </span>
          </div>
          <AwardGrid awards={myDailyAwards} />
        </div>

        {/* ── PARTNER DAILY AWARDS ── */}
        {partner && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-gray-800">🎯 {partner.name}ning bugungi mukofotlari</h2>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
                {partnerEarnedToday.length}/{partnerDailyAwards.length} · {partnerTodayPoints} ball
              </span>
            </div>
            <AwardGrid awards={partnerDailyAwards} />
          </div>
        )}

        {/* ── MY CUMULATIVE ── */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black text-gray-800">🏅 Mening rekordlarim</h2>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">
              {myEarnedCumul}/{myCumulative.length}
            </span>
          </div>
          <CumulativeList awards={myCumulative} history={myAwardHistory} />
        </div>

        {/* ── PARTNER CUMULATIVE ── */}
        {partner && partnerCumulative.length > 0 && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-gray-800">🏅 {partner.name}ning rekordlari</h2>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
                {partnerEarnedCumul}/{partnerCumulative.length}
              </span>
            </div>
            <CumulativeList awards={partnerCumulative} history={{}} />
          </div>
        )}

        {/* ── DAILY HISTORY ── */}
        <DailyHistory
          myName={user?.name || ''}
          partnerName={partner?.name || ''}
          myEntries={myEntries}
          partnerEntries={partnerEntries}
          todayStr={todayStr}
        />

        {/* ── DAILY MOTIVATIONAL QUOTE ── */}
        <div className="card-gold p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Bugungi oyat / hadis</p>
          <p className="text-xl gold-arabic mb-2" dir="rtl">{quote.arabic}</p>
          <p className="text-sm text-gray-600 italic">{quote.uzbek}</p>
        </div>

      </div>
      <Navigation />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────

function ScoreCard({
  name, score, level, earnedCount, streak, isMe = false,
}: {
  name: string;
  score: number;
  level: ReturnType<typeof getScoreLevel>;
  earnedCount: number;
  streak: number;
  isMe?: boolean;
}) {
  return (
    <div className={`rounded-2xl border-2 p-4 text-center ${level.bgClass} ${isMe ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}>
      <p className={`text-xs font-black truncate mb-1 ${level.colorClass}`}>{name}</p>
      <p className="text-3xl font-black text-gray-800">{score}</p>
      <p className="text-xs text-gray-400 mb-1">ball</p>
      <p className={`text-lg font-bold ${level.colorClass}`}>{level.emoji} {level.label}</p>
      <div className="mt-2 flex justify-center gap-2 flex-wrap">
        <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full text-gray-600">🏅 {earnedCount} mukofot</span>
        {streak > 0 && <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full text-orange-600">🔥 {streak} kun</span>}
      </div>
    </div>
  );
}

function AwardGrid({ awards }: { awards: DailyAward[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {awards.map((a) => (
        <div
          key={a.id}
          className={`rounded-2xl border-2 p-3 text-center transition-all ${
            a.earned
              ? `${COLOR_MAP[a.colorKey] ?? 'bg-green-50 border-green-300 text-green-700'} shadow-sm`
              : 'bg-gray-50 border-gray-100 text-gray-300'
          }`}
        >
          <div className="text-2xl mb-1">{a.earned ? a.icon : '🔒'}</div>
          <p className={`text-xs font-bold leading-tight ${a.earned ? '' : 'text-gray-300'}`}>
            {a.title}
          </p>
          {a.earned && (
            <p className="text-xs font-black mt-1">+{a.points} ball</p>
          )}
        </div>
      ))}
    </div>
  );
}

function DailyHistory({
  myName, partnerName, myEntries, partnerEntries, todayStr,
}: {
  myName: string;
  partnerName: string;
  myEntries: DailyEntry[];
  partnerEntries: DailyEntry[];
  todayStr: string;
}) {
  const myMap = new Map(myEntries.map(e => [String(e.date).substring(0, 10), e]));
  const pMap  = new Map(partnerEntries.map(e => [String(e.date).substring(0, 10), e]));

  const allDates = new Set([
    ...myEntries.map(e => String(e.date).substring(0, 10)),
    ...partnerEntries.map(e => String(e.date).substring(0, 10)),
  ]);
  const pastDates = [...allDates]
    .filter(d => d !== todayStr)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 20);

  if (pastDates.length === 0) return null;

  return (
    <div className="card p-5">
      <h2 className="font-black text-gray-800 mb-4">📅 O&apos;tgan kunlar tarixi</h2>
      <div className="space-y-2">
        {pastDates.map(dateStr => {
          const myE = myMap.get(dateStr) || null;
          const pE  = pMap.get(dateStr)  || null;
          const myAwards = myE ? computeDailyAwards(myE, [], [], 0, 0).filter(a => a.earned) : [];
          const pAwards  = pE  ? computeDailyAwards(pE,  [], [], 0, 0).filter(a => a.earned) : [];
          const myScore  = computeDayScore(myE);
          const pScore   = computeDayScore(pE);
          const myLvl    = getScoreLevel(myScore);
          const pLvl     = getScoreLevel(pScore);

          return (
            <div key={dateStr} className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
              <p className="text-xs font-bold text-gray-400 mb-2">{formatDisplayDate(dateStr)}</p>
              <div className="space-y-1.5">
                {/* My row */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-700 w-16 shrink-0 truncate">{myName}</span>
                  <div className="flex gap-0.5 flex-1 min-w-0">
                    {myE
                      ? myAwards.length > 0
                        ? myAwards.map(a => <span key={a.id} className="text-sm" title={a.title}>{a.icon}</span>)
                        : <span className="text-xs text-gray-300 italic">—</span>
                      : <span className="text-xs text-gray-200">kiritilmagan</span>}
                  </div>
                  {myE && (
                    <span className={`text-xs font-black shrink-0 ${myLvl.colorClass}`}>
                      {myScore} ball
                    </span>
                  )}
                </div>
                {/* Partner row */}
                {partnerName && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-700 w-16 shrink-0 truncate">{partnerName}</span>
                    <div className="flex gap-0.5 flex-1 min-w-0">
                      {pE
                        ? pAwards.length > 0
                          ? pAwards.map(a => <span key={a.id} className="text-sm" title={a.title}>{a.icon}</span>)
                          : <span className="text-xs text-gray-300 italic">—</span>
                        : <span className="text-xs text-gray-200">kiritilmagan</span>}
                    </div>
                    {pE && (
                      <span className={`text-xs font-black shrink-0 ${pLvl.colorClass}`}>
                        {pScore} ball
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CumulativeList({
  awards,
  history,
}: {
  awards: CumulativeAward[];
  history: Record<string, string>;
}) {
  const earned = awards.filter((a) => a.earned);
  const locked = awards.filter((a) => !a.earned);

  return (
    <div className="space-y-2">
      {earned.map((a) => (
        <div key={a.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <span className="text-2xl w-8 text-center flex-shrink-0">{a.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-800 truncate">{a.title}</p>
            <p className="text-xs text-gray-500 truncate">{a.desc}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-green-600 font-bold">✓ Olindi</p>
            {history[a.id] && (
              <p className="text-xs text-gray-400">{history[a.id]}</p>
            )}
          </div>
        </div>
      ))}
      {locked.length > 0 && (
        <>
          <p className="text-xs text-gray-400 font-semibold mt-3 mb-2 pl-1">Hali olinmagan:</p>
          {locked.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl opacity-60">
              <span className="text-xl w-8 text-center flex-shrink-0">🔒</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-400 truncate">{a.title}</p>
                <p className="text-xs text-gray-400 truncate">{a.desc}</p>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
