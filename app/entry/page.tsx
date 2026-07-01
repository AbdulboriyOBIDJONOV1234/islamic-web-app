'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSession, today, formatDisplayDate, countPrayers } from '@/lib/utils';
import { getEntryByDate, upsertEntry } from '@/lib/supabase';
import type { DailyEntry, Prayer } from '@/lib/types';
import { PRAYERS, DHIKR_TYPES, SALAWAT_OPTIONS } from '@/lib/types';

type PrayerState = Record<Prayer, boolean>;
type DhikrState = Record<string, number>;

const DEFAULT_PRAYERS: PrayerState = {
  bomdod: false, peshin: false, asr: false, shom: false, xufton: false,
};

export default function EntryPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [prayers, setPrayers] = useState<PrayerState>({ ...DEFAULT_PRAYERS });
  const [dhikr, setDhikr] = useState<DhikrState>({
    subhanallah_count: 0, alhamdulillah_count: 0, allahu_akbar_count: 0,
    la_ilaha_count: 0, astaghfirullah_count: 0,
  });
  const [salawatCount, setSalawatCount] = useState('');
  const [salawatNotes, setSalawatNotes] = useState('');
  const [customSalawat, setCustomSalawat] = useState('');
  const [existingEntry, setExistingEntry] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setUser(session);
    loadEntry(session.id);
  }, [router]);

  async function loadEntry(userId: string) {
    setLoading(true);
    try {
      const entry = await getEntryByDate(userId, today());
      if (entry) {
        setExistingEntry(entry);
        setPrayers({ bomdod: entry.bomdod, peshin: entry.peshin, asr: entry.asr, shom: entry.shom, xufton: entry.xufton });
        setDhikr({
          subhanallah_count: entry.subhanallah_count || 0,
          alhamdulillah_count: entry.alhamdulillah_count || 0,
          allahu_akbar_count: entry.allahu_akbar_count || 0,
          la_ilaha_count: entry.la_ilaha_count || 0,
          astaghfirullah_count: entry.astaghfirullah_count || 0,
        });
        setSalawatCount(entry.salawat_count > 0 ? String(entry.salawat_count) : '');
        setSalawatNotes(entry.salawat_notes || '');
      }
    } finally {
      setLoading(false);
    }
  }

  function togglePrayer(key: Prayer) {
    setPrayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setDhikrVal(key: string, val: string) {
    setDhikr((prev) => ({ ...prev, [key]: parseInt(val) || 0 }));
  }

  function addCustomSalawat() {
    if (!customSalawat.trim()) return;
    setSalawatNotes((prev) => prev ? `${prev}\n${customSalawat.trim()}` : customSalawat.trim());
    setCustomSalawat('');
  }

  const totalDhikr = Object.values(dhikr).reduce((s, n) => s + n, 0);
  const donePrayers = countPrayers({ ...prayers } as unknown as DailyEntry);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await upsertEntry(user.id, today(), {
        ...prayers,
        dhikr_count: totalDhikr,
        salawat_count: parseInt(salawatCount) || 0,
        ...dhikr,
        salawat_notes: salawatNotes,
      });
      setSaved(true);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch {
      alert("Saqlashda xatolik. Qayta urinib ko'ring.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-bg">
        <div className="text-white">⏳ Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 page-bg">
      <div className="header-bg text-white px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto">
          <p className="text-green-400 text-xs uppercase tracking-widest mb-1">{user?.name}</p>
          <h1 className="text-2xl font-black">Bugungi kiritish ✦</h1>
          <p className="text-green-400 text-xs mt-1">{formatDisplayDate(today())}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4 fade-in">

        {/* === NAMOZLAR === */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black text-gray-800">🕌 Namozlar</h2>
            <span className={`text-sm font-black px-3 py-1 rounded-full ${donePrayers === 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {donePrayers}/5
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PRAYERS.map((p) => (
              <button type="button" key={p.key} onClick={() => togglePrayer(p.key)}
                className={`prayer-btn ${prayers[p.key] ? 'prayer-active' : 'prayer-inactive'}`}>
                <div className="text-xs font-bold leading-tight">{p.label}</div>
                <div className="text-xl mt-1">{prayers[p.key] ? '✓' : '○'}</div>
              </button>
            ))}
          </div>
          {donePrayers === 5 && (
            <p className="mt-3 text-center text-xs text-green-600 font-bold">🎉 MashaAlloh! Barcha namozlar!</p>
          )}
        </div>

        {/* === ZIKRLAR === */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-1">
            <h2 className="font-black text-gray-800">📿 Zikrlar</h2>
            <span className="text-sm font-black text-green-700 bg-green-50 px-3 py-1 rounded-full">
              Jami: {totalDhikr.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Har bir zikr uchun nechta aytganingizni kiriting</p>

          <div className="space-y-3">
            {DHIKR_TYPES.map((d) => (
              <div key={d.key} className="dhikr-row">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{d.label}</p>
                  <p className="dhikr-arabic text-xs">{d.arabic}</p>
                  <p className="text-xs text-gray-400">Tavsiya: ×{d.suggested}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <input
                    type="number" min="0" max="9999"
                    value={dhikr[d.key] || ''}
                    onChange={(e) => setDhikrVal(d.key, e.target.value)}
                    placeholder="0"
                    className="dhikr-input"
                  />
                  <div className="flex gap-1">
                    {[d.suggested, d.suggested * 2].map((n) => (
                      <button type="button" key={n}
                        onClick={() => setDhikrVal(d.key, String(n))}
                        className="quick-btn quick-btn-sm">
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === SALOVAT === */}
        <div className="card p-5">
          <h2 className="font-black text-gray-800 mb-1">💚 Salovat</h2>
          <p className="text-xs dhikr-arabic text-sm mb-1">اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ</p>
          <p className="text-xs text-gray-400 mb-4">Allohhumma solli ala Muhammad ﷺ</p>

          {/* Count */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Jami marta</label>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="99999"
                value={salawatCount}
                onChange={(e) => setSalawatCount(e.target.value)}
                placeholder="0"
                className="number-input" />
              <span className="text-sm text-gray-400">marta</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[10, 100, 200, 500, 1000].map((n) => (
                <button type="button" key={n}
                  onClick={() => setSalawatCount(String(n))}
                  className="quick-btn">{n}</button>
              ))}
            </div>
          </div>

          {/* Salawat types */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Qaysi salovotlarni aytdingiz?</label>
            <div className="space-y-2">
              {SALAWAT_OPTIONS.map((s) => {
                const selected = salawatNotes.includes(s.label);
                return (
                  <button type="button" key={s.label}
                    onClick={() => {
                      if (selected) {
                        setSalawatNotes((prev) => prev.split('\n').filter((l) => l !== s.label).join('\n'));
                      } else {
                        setSalawatNotes((prev) => prev ? `${prev}\n${s.label}` : s.label);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selected ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-gray-50'
                    }`}>
                    <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                    <p className="text-xs dhikr-arabic">{s.arabic}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom salawat */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">O'zingiz qo'shing</label>
            <div className="flex gap-2">
              <input type="text" value={customSalawat}
                onChange={(e) => setCustomSalawat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomSalawat()}
                placeholder="Boshqa salovat..."
                className="flex-1 px-3 py-2 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-green-400" />
              <button type="button" onClick={addCustomSalawat}
                className="px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-bold">
                +
              </button>
            </div>
            {salawatNotes && (
              <div className="mt-2 p-3 bg-green-50 rounded-xl">
                <p className="text-xs text-green-700 font-semibold mb-1">Qo'shilganlar:</p>
                {salawatNotes.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex justify-between items-center text-xs text-green-800 py-0.5">
                    <span>✓ {line}</span>
                    <button type="button"
                      onClick={() => setSalawatNotes((prev) => prev.split('\n').filter((l) => l !== line).join('\n'))}
                      className="text-red-400 ml-2">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === SAQLASH === */}
        {saved ? (
          <div className="card p-6 text-center">
            <div className="text-5xl mb-2">✅</div>
            <p className="font-black text-green-700 text-lg">JazakAlloh xayr!</p>
            <p className="text-xs text-gray-400 mt-1">Saqlandi, yo'naltirilyapti...</p>
          </div>
        ) : (
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? '⏳ Saqlanmoqda...' : existingEntry ? '💾 Yangilash' : '💾 Saqlash'}
          </button>
        )}

        {existingEntry && !saved && (
          <p className="text-center text-xs text-gray-400 pb-2">
            Bugungi yozuv mavjud — yangilash mumkin
          </p>
        )}
      </div>
      <Navigation />
    </div>
  );
}
