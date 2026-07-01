'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSession, today, formatDisplayDate, countPrayers } from '@/lib/utils';
import { getEntryByDate, upsertEntry } from '@/lib/supabase';
import type { DailyEntry, Prayer } from '@/lib/types';
import { PRAYERS } from '@/lib/types';

type PrayerState = Record<Prayer, boolean>;

const DEFAULT_PRAYERS: PrayerState = {
  bomdod: false,
  peshin: false,
  asr: false,
  shom: false,
  xufton: false,
};

export default function EntryPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [prayers, setPrayers] = useState<PrayerState>({ ...DEFAULT_PRAYERS });
  const [dhikr, setDhikr] = useState('');
  const [salawat, setSalawat] = useState('');
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
        setPrayers({
          bomdod: entry.bomdod,
          peshin: entry.peshin,
          asr: entry.asr,
          shom: entry.shom,
          xufton: entry.xufton,
        });
        setDhikr(entry.dhikr_count > 0 ? String(entry.dhikr_count) : '');
        setSalawat(entry.salawat_count > 0 ? String(entry.salawat_count) : '');
      }
    } finally {
      setLoading(false);
    }
  }

  function togglePrayer(key: Prayer) {
    setPrayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await upsertEntry(user.id, today(), {
        ...prayers,
        dhikr_count: parseInt(dhikr) || 0,
        salawat_count: parseInt(salawat) || 0,
      });
      setSaved(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err) {
      console.error(err);
      alert("Saqlashda xatolik. Qayta urinib ko'ring.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-bg">
        <div className="text-white text-xl">⏳ Yuklanmoqda...</div>
      </div>
    );
  }

  const donePrayers = countPrayers({
    ...prayers,
    dhikr_count: 0,
    salawat_count: 0,
  } as DailyEntry);

  return (
    <div className="min-h-screen pb-28 entry-bg">
      {/* Header */}
      <div className="login-bg text-white px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto">
          <p className="text-green-200 text-sm mb-1">{user?.name}</p>
          <h1 className="text-2xl font-bold">Bugungi kiritish</h1>
          <p className="text-green-200 text-xs mt-1">{formatDisplayDate(today())}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4 fade-in">
        {/* Prayers section */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800">🕌 Namozlar</h2>
            <span className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
              {donePrayers}/5
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {PRAYERS.map((p) => (
              <button
                type="button"
                key={p.key}
                onClick={() => togglePrayer(p.key)}
                className={`prayer-btn ${prayers[p.key] ? 'prayer-active' : 'prayer-inactive'}`}
              >
                <div className="text-xs font-bold leading-tight">{p.label}</div>
                <div className="text-xl mt-1">{prayers[p.key] ? '✓' : '○'}</div>
              </button>
            ))}
          </div>

          {donePrayers === 5 && (
            <p className="mt-3 text-center text-sm text-green-600 font-semibold">
              🎉 Barcha namozlar o&apos;qildi!
            </p>
          )}
          {donePrayers < 5 && donePrayers > 0 && (
            <p className="mt-3 text-center text-xs text-orange-500">
              ⚠️ {5 - donePrayers} ta namoz qoldirildi
            </p>
          )}
        </div>

        {/* Dhikr section */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-1">📿 Zikr</h2>
          <p className="text-xs text-gray-400 mb-4">
            SubhanAlloh × 33, Alhamdulilloh × 33, Allohu Akbar × 34 = 100
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="9999"
              value={dhikr}
              onChange={(e) => setDhikr(e.target.value)}
              placeholder="0"
              className="number-input"
            />
            <div className="text-sm text-gray-500">marta</div>
          </div>
          <div className="flex gap-2 mt-3">
            {[33, 99, 100, 300].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setDhikr(String(n))}
                className="quick-btn"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Salawat section */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-1">💚 Salovat</h2>
          <p className="text-xs text-gray-400 mb-4 arabic-text text-sm">
            اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="9999"
              value={salawat}
              onChange={(e) => setSalawat(e.target.value)}
              placeholder="0"
              className="number-input"
            />
            <div className="text-sm text-gray-500">marta</div>
          </div>
          <div className="flex gap-2 mt-3">
            {[10, 100, 200, 500].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setSalawat(String(n))}
                className="quick-btn"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        {saved ? (
          <div className="card p-5 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-bold text-green-700">Saqlandi! JazakAlloh!</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? '⏳ Saqlanmoqda...' : existingEntry ? '💾 Yangilash' : '💾 Saqlash'}
          </button>
        )}

        {existingEntry && !saved && (
          <p className="text-center text-xs text-gray-400">
            Bugun allaqachon kiritilgan. Yangilash mumkin.
          </p>
        )}
      </div>

      <Navigation />
    </div>
  );
}
