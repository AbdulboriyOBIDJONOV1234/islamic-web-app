'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSession } from '@/lib/utils';
import {
  getQuranProgress, setQuranProgress,
  getDuaChecklist, setDuaChecklist,
  getGoals, setGoals,
  type MonthlyGoals,
} from '@/lib/local';
import { SURAHS } from '@/lib/quran-data';
import { MORNING_DUAS, EVENING_DUAS } from '@/lib/dua-data';
import { today } from '@/lib/utils';
import { format } from 'date-fns';

type Tab = 'quran' | 'dua' | 'goals';

export default function QuranPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [tab, setTab] = useState<Tab>('quran');
  const [readSurahs, setReadSurahs] = useState<number[]>([]);
  const [khatmCount, setKhatmCount] = useState(0);
  const [morningDone, setMorningDone] = useState<number[]>([]);
  const [eveningDone, setEveningDone] = useState<number[]>([]);
  const [goals, setGoalsState] = useState<MonthlyGoals>({ namoz: 25, dhikr: 3000, salawat: 3000, pages: 100 });
  const [yearMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [goalsSaved, setGoalsSaved] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setUser(session);

    const qp = getQuranProgress(session.id);
    setReadSurahs(qp.read);
    setKhatmCount(qp.khatmCount);

    const dc = getDuaChecklist(session.id, today());
    setMorningDone(dc.morning);
    setEveningDone(dc.evening);

    setGoalsState(getGoals(session.id, yearMonth));
  }, [router, yearMonth]);

  function toggleSurah(index: number) {
    if (!user) return;
    let newRead = readSurahs.includes(index)
      ? readSurahs.filter((i) => i !== index)
      : [...readSurahs, index];

    let newKhatm = khatmCount;
    // If all 114 surahs are now read, complete a khatm
    if (newRead.length === 114) {
      newKhatm = khatmCount + 1;
      newRead = [];
    }

    setReadSurahs(newRead);
    setKhatmCount(newKhatm);
    setQuranProgress(user.id, { read: newRead, khatmCount: newKhatm });
  }

  function resetQuran() {
    if (!user) return;
    if (!confirm('Qur\'on progresini noldan boshlashni xohlaysizmi?')) return;
    setReadSurahs([]);
    setQuranProgress(user.id, { read: [], khatmCount });
  }

  function toggleMorningDua(id: number) {
    if (!user) return;
    const newDone = morningDone.includes(id)
      ? morningDone.filter((i) => i !== id)
      : [...morningDone, id];
    setMorningDone(newDone);
    setDuaChecklist(user.id, today(), { morning: newDone, evening: eveningDone });
  }

  function toggleEveningDua(id: number) {
    if (!user) return;
    const newDone = eveningDone.includes(id)
      ? eveningDone.filter((i) => i !== id)
      : [...eveningDone, id];
    setEveningDone(newDone);
    setDuaChecklist(user.id, today(), { morning: morningDone, evening: newDone });
  }

  function handleGoalChange(field: keyof MonthlyGoals, val: string) {
    const n = parseInt(val) || 0;
    setGoalsState((prev) => ({ ...prev, [field]: n }));
    setGoalsSaved(false);
  }

  function saveGoals() {
    if (!user) return;
    setGoals(user.id, yearMonth, goals);
    setGoalsSaved(true);
    setTimeout(() => setGoalsSaved(false), 2000);
  }

  const pct = Math.round((readSurahs.length / 114) * 100);

  return (
    <div className="min-h-screen pb-28 page-bg">
      {/* Header */}
      <div className="header-bg text-white px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black">📖 Diniy</h1>
          <p className="text-green-400 text-xs mt-1 uppercase tracking-widest">Qur&apos;on · Duolar · Maqsad</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 fade-in">

        {/* Tabs */}
        <div className="card p-2 flex gap-1 mb-4">
          {(['quran', 'dua', 'goals'] as Tab[]).map((t) => (
            <button type="button" key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t ? 'bg-green-800 text-white shadow' : 'text-gray-400'
              }`}>
              {t === 'quran' ? '📖 Qur\'on' : t === 'dua' ? '🤲 Duolar' : '🎯 Maqsad'}
            </button>
          ))}
        </div>

        {/* === QURAN TAB === */}
        {tab === 'quran' && (
          <div className="space-y-4">
            {/* Khatm progress */}
            <div className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="font-black text-gray-800 text-lg">Xatm hisobi</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Barcha 114 surani belgilang → xatm to&apos;liq!</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-green-700">{khatmCount}</div>
                  <div className="text-xs text-gray-400">xatm</div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{readSurahs.length}/114 sura o&apos;qildi</span>
                <span>{pct}%</span>
              </div>
              <div className="quran-progress-bar mb-3">
                <QuranProgress pct={pct} />
              </div>

              <button type="button" onClick={resetQuran}
                className="text-xs text-gray-400 mt-2 hover:text-red-500 transition-colors">
                ↺ Progresni noldan boshlash
              </button>
            </div>

            {/* Surah grid */}
            <div className="card p-4">
              <h3 className="font-bold text-gray-800 mb-3">Qur&apos;on suralari</h3>
              <div className="surah-grid">
                {SURAHS.map((s) => {
                  const done = readSurahs.includes(s.index);
                  return (
                    <button
                      key={s.index}
                      type="button"
                      onClick={() => toggleSurah(s.index)}
                      className={`surah-cell ${done ? 'surah-done' : 'surah-undone'}`}
                      title={`${s.number}. ${s.name} (${s.verses} oyat)`}
                    >
                      {s.number}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-3 text-xs text-gray-400 justify-center">
                <span className="flex items-center gap-1">
                  <span className="surah-legend-done" /> O&apos;qildi
                </span>
                <span className="flex items-center gap-1">
                  <span className="surah-legend-undone" /> O&apos;qilmadi
                </span>
              </div>
            </div>

            {/* Popular surahs quick access */}
            <div className="card p-4">
              <h3 className="font-bold text-gray-800 mb-3">⭐ Tez-tez o&apos;qiladigan suralar</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { index: 0, name: 'Al-Fotiha', arabic: 'الفاتحة' },
                  { index: 35, name: 'Yosin', arabic: 'يس' },
                  { index: 66, name: 'Al-Mulk', arabic: 'الملك' },
                  { index: 54, name: 'Ar-Rohmon', arabic: 'الرحمن' },
                  { index: 17, name: 'Al-Kahf', arabic: 'الكهف' },
                  { index: 111, name: 'Al-Ixlos', arabic: 'الإخلاص' },
                  { index: 112, name: 'Al-Falaq', arabic: 'الفلق' },
                  { index: 113, name: 'An-Nos', arabic: 'الناس' },
                ].map((s) => {
                  const done = readSurahs.includes(s.index);
                  return (
                    <button key={s.index} type="button"
                      onClick={() => toggleSurah(s.index)}
                      className={`popular-surah-btn ${done ? 'popular-surah-done' : 'popular-surah-undone'}`}>
                      <span className="font-bold text-sm">{s.name}</span>
                      <span className="text-xs opacity-70">{s.arabic}</span>
                      {done && <span className="text-green-500 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* === DUA TAB === */}
        {tab === 'dua' && (
          <div className="space-y-4">
            {/* Morning duas */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-gray-800">🌅 Ertalabki azkorlar</h2>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">
                  {morningDone.length}/{MORNING_DUAS.length}
                </span>
              </div>
              <div className="space-y-2">
                {MORNING_DUAS.map((dua) => {
                  const done = morningDone.includes(dua.id);
                  return (
                    <button key={dua.id} type="button"
                      onClick={() => toggleMorningDua(dua.id)}
                      className={`dua-item ${done ? 'dua-done' : 'dua-undone'}`}>
                      <div className={`dua-check ${done ? 'dua-check-done' : 'dua-check-undone'}`}>
                        {done ? '✓' : ''}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${done ? 'text-green-700' : 'text-gray-700'}`}>
                          {dua.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{dua.uzbek}</p>
                        <p className="text-xs text-gray-300 mt-0.5 text-right" dir="rtl">{dua.arabic}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Evening duas */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-gray-800">🌙 Kechki azkorlar</h2>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">
                  {eveningDone.length}/{EVENING_DUAS.length}
                </span>
              </div>
              <div className="space-y-2">
                {EVENING_DUAS.map((dua) => {
                  const done = eveningDone.includes(dua.id);
                  return (
                    <button key={dua.id} type="button"
                      onClick={() => toggleEveningDua(dua.id)}
                      className={`dua-item ${done ? 'dua-done' : 'dua-undone'}`}>
                      <div className={`dua-check ${done ? 'dua-check-done' : 'dua-check-indigo'}`}>
                        {done ? '✓' : ''}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${done ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {dua.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{dua.uzbek}</p>
                        <p className="text-xs text-gray-300 mt-0.5 text-right" dir="rtl">{dua.arabic}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* === GOALS TAB === */}
        {tab === 'goals' && (
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-black text-gray-800 mb-1">🎯 Oylik maqsad</h2>
              <p className="text-xs text-gray-400 mb-4">{yearMonth} oy uchun maqsadlarni belgilang</p>

              <div className="space-y-4">
                <GoalInput
                  label="🕌 5/5 Namoz kunlar (maqsad)"
                  value={goals.namoz}
                  unit="kun"
                  onChange={(v) => handleGoalChange('namoz', v)}
                />
                <GoalInput
                  label="📿 Zikr (oylik jami)"
                  value={goals.dhikr}
                  unit="marta"
                  onChange={(v) => handleGoalChange('dhikr', v)}
                />
                <GoalInput
                  label="💚 Salovat (oylik jami)"
                  value={goals.salawat}
                  unit="marta"
                  onChange={(v) => handleGoalChange('salawat', v)}
                />
                <GoalInput
                  label="📚 Kitob sahifalari (oylik)"
                  value={goals.pages}
                  unit="sahifa"
                  onChange={(v) => handleGoalChange('pages', v)}
                />
              </div>

              <button type="button" onClick={saveGoals}
                className="btn-primary mt-4">
                {goalsSaved ? '✓ Saqlandi!' : '💾 Saqlash'}
              </button>
            </div>

            <div className="card-gold p-4">
              <p className="text-sm font-bold text-gray-700 mb-2">💡 Maslahat</p>
              <p className="text-xs text-gray-600">
                Maqsadlar faqat siz uchun — hamkoringiz ko&apos;rmaydi.
                Dashboard sahifasida oy oxirigacha qancha qolgani ko&apos;rinadi.
              </p>
            </div>
          </div>
        )}
      </div>
      <Navigation />
    </div>
  );
}

function QuranProgress({ pct }: { pct: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.style.setProperty('--progress-width', `${pct}%`);
  }, [pct]);
  return <div className="quran-progress-fill" ref={ref} />;
}

function GoalInput({ label, value, unit, onChange }: {
  label: string; value: number; unit: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label}
        <div className="flex items-center gap-2 mt-1.5">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={0}
            className="goal-number-input"
          />
          <span className="text-sm text-gray-500 font-normal normal-case">{unit}</span>
        </div>
      </label>
    </div>
  );
}
