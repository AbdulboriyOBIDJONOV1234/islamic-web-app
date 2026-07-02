'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSession, today, formatDisplayDate } from '@/lib/utils';
import { getEntryByDate, upsertEntry } from '@/lib/supabase';
import type { Prayer } from '@/lib/types';
import { PRAYERS, DHIKR_TYPES, SALAWAT_OPTIONS } from '@/lib/types';

type PrayerState = Record<Prayer, boolean>;
type DhikrState = Record<string, number>;
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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
  const [morningPages, setMorningPages] = useState('');
  const [eveningPages, setEveningPages] = useState('');
  const [bookName, setBookName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Refs to avoid stale closures in auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false); // true after initial data is loaded
  const userRef = useRef<{ id: string; name: string } | null>(null);
  const stateRef = useRef({ prayers, dhikr, salawatCount, salawatNotes, morningPages, eveningPages, bookName });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = { prayers, dhikr, salawatCount, salawatNotes, morningPages, eveningPages, bookName };
  });

  const saveToDb = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    const s = stateRef.current;
    const total = Object.values(s.dhikr).reduce((acc, n) => acc + n, 0);
    setSaveStatus('saving');
    try {
      await upsertEntry(u.id, today(), {
        ...s.prayers,
        dhikr_count: total,
        salawat_count: parseInt(s.salawatCount) || 0,
        ...s.dhikr,
        salawat_notes: s.salawatNotes,
        morning_pages: parseInt(s.morningPages) || 0,
        evening_pages: parseInt(s.eveningPages) || 0,
        book_name: s.bookName.trim(),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, []);

  // Schedule auto-save with debounce
  function scheduleAutoSave(immediate = false) {
    if (!readyRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const delay = immediate ? 100 : 1500;
    saveTimerRef.current = setTimeout(() => { saveToDb(); }, delay);
  }

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/'); return; }
    setUser(session);
    userRef.current = session;
    loadEntry(session.id);
  }, [router]);

  async function loadEntry(userId: string) {
    setLoading(true);
    try {
      const entry = await getEntryByDate(userId, today());
      if (entry) {
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
        setMorningPages(entry.morning_pages > 0 ? String(entry.morning_pages) : '');
        setEveningPages(entry.evening_pages > 0 ? String(entry.evening_pages) : '');
        setBookName(entry.book_name || '');
      }
    } finally {
      setLoading(false);
      // Allow auto-save after initial data is loaded
      setTimeout(() => { readyRef.current = true; }, 300);
    }
  }

  function togglePrayer(key: Prayer) {
    setPrayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Update stateRef immediately so save uses new value
      stateRef.current = { ...stateRef.current, prayers: next };
      return next;
    });
    scheduleAutoSave(true); // immediate save for prayer toggle
  }

  function setDhikrVal(key: string, val: string) {
    const n = parseInt(val) || 0;
    setDhikr((prev) => {
      const next = { ...prev, [key]: n };
      stateRef.current = { ...stateRef.current, dhikr: next };
      return next;
    });
    scheduleAutoSave();
  }

  function handleSalawatCount(val: string) {
    setSalawatCount(val);
    stateRef.current = { ...stateRef.current, salawatCount: val };
    scheduleAutoSave();
  }

  function handleMorningPages(val: string) {
    setMorningPages(val);
    stateRef.current = { ...stateRef.current, morningPages: val };
    scheduleAutoSave();
  }

  function handleEveningPages(val: string) {
    setEveningPages(val);
    stateRef.current = { ...stateRef.current, eveningPages: val };
    scheduleAutoSave();
  }

  function handleBookName(val: string) {
    setBookName(val);
    stateRef.current = { ...stateRef.current, bookName: val };
    scheduleAutoSave();
  }

  function addCustomSalawat() {
    if (!customSalawat.trim()) return;
    const updated = salawatNotes ? `${salawatNotes}\n${customSalawat.trim()}` : customSalawat.trim();
    setSalawatNotes(updated);
    stateRef.current = { ...stateRef.current, salawatNotes: updated };
    setCustomSalawat('');
    scheduleAutoSave();
  }

  function toggleSalawatNote(label: string) {
    const lines = salawatNotes.split('\n').filter(Boolean);
    const updated = lines.includes(label)
      ? lines.filter((l) => l !== label).join('\n')
      : [...lines, label].join('\n');
    setSalawatNotes(updated);
    stateRef.current = { ...stateRef.current, salawatNotes: updated };
    scheduleAutoSave();
  }

  const totalDhikr = Object.values(dhikr).reduce((s, n) => s + n, 0);
  const donePrayers = Object.values(prayers).filter(Boolean).length;

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
        <div className="max-w-md mx-auto flex justify-between items-end">
          <div>
            <p className="text-green-400 text-xs uppercase tracking-widest mb-1">{user?.name}</p>
            <h1 className="text-2xl font-black">Bugungi kiritish ✦</h1>
            <p className="text-green-400 text-xs mt-1">{formatDisplayDate(today())}</p>
          </div>
          {/* Auto-save status */}
          <div className="text-right pb-1">
            {saveStatus === 'saving' && <span className="text-xs text-yellow-300 animate-pulse">⟳ Saqlanmoqda...</span>}
            {saveStatus === 'saved' && <span className="text-xs text-green-300">✓ Saqlandi</span>}
            {saveStatus === 'error' && <span className="text-xs text-red-300">⚠ Xato</span>}
            {saveStatus === 'idle' && <span className="text-xs text-green-400/60">Avtomatik saqlanadi</span>}
          </div>
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
          <p className="text-xs text-gray-400 mb-4">Allohumma solli ala Muhammad ﷺ</p>

          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Jami marta</label>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="99999"
                value={salawatCount}
                onChange={(e) => handleSalawatCount(e.target.value)}
                placeholder="0"
                className="number-input" />
              <span className="text-sm text-gray-400">marta</span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[10, 100, 200, 500, 1000].map((n) => (
                <button type="button" key={n}
                  onClick={() => handleSalawatCount(String(n))}
                  className="quick-btn">{n}</button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Qaysi salovotlarni aytdingiz?</label>
            <div className="space-y-2">
              {SALAWAT_OPTIONS.map((s) => {
                const selected = salawatNotes.split('\n').includes(s.label);
                return (
                  <button type="button" key={s.label}
                    onClick={() => toggleSalawatNote(s.label)}
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

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">O&apos;zingiz qo&apos;shing</label>
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
                <p className="text-xs text-green-700 font-semibold mb-1">Qo&apos;shilganlar:</p>
                {salawatNotes.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex justify-between items-center text-xs text-green-800 py-0.5">
                    <span>✓ {line}</span>
                    <button type="button"
                      onClick={() => {
                        const updated = salawatNotes.split('\n').filter((l) => l !== line).join('\n');
                        setSalawatNotes(updated);
                        stateRef.current = { ...stateRef.current, salawatNotes: updated };
                        scheduleAutoSave();
                      }}
                      className="text-red-400 ml-2">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === KITOB O'QISH === */}
        <div className="card p-5">
          <h2 className="font-black text-gray-800 mb-1">📚 Kitob o&apos;qish</h2>
          <p className="text-xs text-gray-400 mb-4">
            Ertalab bomdoddan keyin · Kechqurun yotishdan oldin
          </p>

          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 mb-2 block">
              Qaysi kitob? (ixtiyoriy)
            </label>
            <input
              type="text"
              value={bookName}
              onChange={(e) => handleBookName(e.target.value)}
              placeholder="Kitob nomi..."
              className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-amber-400 bg-amber-50/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-amber-700 mb-2 block">
                🌅 Ertalab (sahifa)
              </label>
              <input
                type="number" min="0" max="999"
                value={morningPages}
                onChange={(e) => handleMorningPages(e.target.value)}
                placeholder="0"
                className="book-input"
              />
              <div className="flex gap-1 mt-1">
                {[5, 10, 20].map((n) => (
                  <button type="button" key={n}
                    onClick={() => handleMorningPages(String(n))}
                    className="quick-btn quick-btn-sm">{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-indigo-700 mb-2 block">
                🌙 Kechqurun (sahifa)
              </label>
              <input
                type="number" min="0" max="999"
                value={eveningPages}
                onChange={(e) => handleEveningPages(e.target.value)}
                placeholder="0"
                className="book-input"
              />
              <div className="flex gap-1 mt-1">
                {[5, 10, 20].map((n) => (
                  <button type="button" key={n}
                    onClick={() => handleEveningPages(String(n))}
                    className="quick-btn quick-btn-sm">{n}</button>
                ))}
              </div>
            </div>
          </div>

          {(parseInt(morningPages) || 0) + (parseInt(eveningPages) || 0) > 0 && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl text-center">
              <p className="text-amber-800 font-bold text-sm">
                📖 Jami: {(parseInt(morningPages) || 0) + (parseInt(eveningPages) || 0)} sahifa
              </p>
              {bookName && <p className="text-xs text-amber-600 mt-0.5">{bookName}</p>}
            </div>
          )}
        </div>

        {/* === STATUS + MANUAL SAVE === */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-700">
              {saveStatus === 'saved' ? '✅ Saqlandi!' : saveStatus === 'saving' ? '⟳ Saqlanmoqda...' : saveStatus === 'error' ? '⚠️ Xatolik' : '💡 Ma\'lumot'}
            </p>
            <p className="text-xs text-gray-400">
              {saveStatus === 'saved' ? 'Barcha ma\'lumotlar bazaga saqlandi' : saveStatus === 'error' ? 'Tarmoqni tekshiring va qayta urining' : 'Har bir o\'zgarish avtomatik saqlanadi'}
            </p>
          </div>
          <button type="button" onClick={() => saveToDb()}
            className="text-xs bg-green-600 text-white px-4 py-2 rounded-xl font-bold">
            💾 Saqlash
          </button>
        </div>

      </div>
      <Navigation />
    </div>
  );
}
