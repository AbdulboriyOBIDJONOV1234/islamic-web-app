import type { DailyEntry } from './types';

export interface DailyAward {
  id: string;
  icon: string;
  title: string;
  desc: string;
  earned: boolean;
  points: number;
  colorKey: string;
}

export interface CumulativeAward {
  id: string;
  icon: string;
  title: string;
  desc: string;
  earned: boolean;
  firstEarned?: string; // date string YYYY-MM-DD
}

// ───────────────────────────────────────
// Scoring
// ───────────────────────────────────────

export function computeDayScore(entry: DailyEntry | null): number {
  if (!entry) return 0;
  const prayers = [entry.bomdod, entry.peshin, entry.asr, entry.shom, entry.xufton].filter(Boolean).length;
  const zikr = (entry.subhanallah_count || 0) + (entry.alhamdulillah_count || 0) +
    (entry.allahu_akbar_count || 0) + (entry.la_ilaha_count || 0) + (entry.astaghfirullah_count || 0);
  const salawat = entry.salawat_count || 0;
  const pages = (entry.morning_pages || 0) + (entry.evening_pages || 0);

  let score = prayers * 20;
  if (prayers === 5) score += 50;
  score += Math.round(Math.min(zikr, 500) * 0.1);
  score += Math.round(Math.min(salawat, 500) * 0.1);
  score += Math.min(pages, 50) * 2;
  return score;
}

export function getScoreLevel(score: number): { emoji: string; label: string; colorClass: string; bgClass: string } {
  if (score >= 200) return { emoji: '👑', label: 'Mukammal', colorClass: 'text-yellow-700', bgClass: 'bg-yellow-50 border-yellow-300' };
  if (score >= 150) return { emoji: '🌟', label: "A'lo",     colorClass: 'text-purple-700', bgClass: 'bg-purple-50 border-purple-300' };
  if (score >= 100) return { emoji: '💚', label: 'Yaxshi',   colorClass: 'text-green-700',  bgClass: 'bg-green-50 border-green-300' };
  if (score >= 50)  return { emoji: '🌱', label: 'Boshliq',  colorClass: 'text-blue-600',   bgClass: 'bg-blue-50 border-blue-300' };
  return               { emoji: '⭐', label: 'Boshlang\'ich', colorClass: 'text-gray-500',  bgClass: 'bg-gray-50 border-gray-200' };
}

// ───────────────────────────────────────
// Daily awards — recomputed every render
// ───────────────────────────────────────

export function computeDailyAwards(
  entry: DailyEntry | null,
  morningDone: number[],
  eveningDone: number[],
  morningTotal: number,
  eveningTotal: number,
): DailyAward[] {
  const prayers = entry
    ? [entry.bomdod, entry.peshin, entry.asr, entry.shom, entry.xufton].filter(Boolean).length
    : 0;
  const sub = entry?.subhanallah_count || 0;
  const alh = entry?.alhamdulillah_count || 0;
  const akb = entry?.allahu_akbar_count || 0;
  const lai = entry?.la_ilaha_count || 0;
  const ast = entry?.astaghfirullah_count || 0;
  const zikr = sub + alh + akb + lai + ast;
  const salawat = entry?.salawat_count || 0;
  const pages = (entry?.morning_pages || 0) + (entry?.evening_pages || 0);

  return [
    {
      id: 'namoz_5',
      icon: '🕌',
      title: '5 Vaqt Namoz',
      desc: 'Barcha 5 vaqt namoz o\'qildi',
      earned: prayers === 5,
      points: 70,
      colorKey: 'green',
    },
    {
      id: 'tasbeh',
      icon: '📿',
      title: 'Tasbeh',
      desc: 'SubhanAlloh 33+, Alhamdulilloh 33+, Allohu Akbar 34+',
      earned: sub >= 33 && alh >= 33 && akb >= 34,
      points: 20,
      colorKey: 'teal',
    },
    {
      id: 'zikr_100',
      icon: '💎',
      title: 'Zikrchi',
      desc: '100 ta va undan ko\'proq zikr aytildi',
      earned: zikr >= 100,
      points: 10,
      colorKey: 'blue',
    },
    {
      id: 'salawat_100',
      icon: '💚',
      title: 'Salovat',
      desc: '100 ta va undan ko\'proq salovat aytildi',
      earned: salawat >= 100,
      points: 10,
      colorKey: 'emerald',
    },
    {
      id: 'kitob_10',
      icon: '📖',
      title: 'O\'quvchi',
      desc: 'Bugun 10 ta sahifadan ko\'proq kitob o\'qildi',
      earned: pages >= 10,
      points: 15,
      colorKey: 'amber',
    },
    {
      id: 'kitob_20',
      icon: '📚',
      title: 'Kitobxon',
      desc: 'Bugun 20 ta sahifadan ko\'proq kitob o\'qildi',
      earned: pages >= 20,
      points: 25,
      colorKey: 'orange',
    },
    {
      id: 'morning_azkar',
      icon: '🌅',
      title: 'Ertalabki Azkorlar',
      desc: 'Barcha ertalabki azkorlar o\'qib chiqildi',
      earned: morningTotal > 0 && morningDone.length >= morningTotal,
      points: 30,
      colorKey: 'amber',
    },
    {
      id: 'evening_azkar',
      icon: '🌙',
      title: 'Kechki Azkorlar',
      desc: 'Barcha kechki azkorlar o\'qib chiqildi',
      earned: eveningTotal > 0 && eveningDone.length >= eveningTotal,
      points: 30,
      colorKey: 'indigo',
    },
    {
      id: 'golden_day',
      icon: '👑',
      title: 'Oltin Kun',
      desc: '5 namoz + 100 zikr + 100 salovat — hammasi bajarildi!',
      earned: prayers === 5 && zikr >= 100 && salawat >= 100,
      points: 50,
      colorKey: 'gold',
    },
  ];
}

// ───────────────────────────────────────
// Cumulative awards
// ───────────────────────────────────────

export function computeCumulativeAwards(entries: DailyEntry[], streak: number): CumulativeAward[] {
  const zikr = entries.reduce((s, e) =>
    s + (e.subhanallah_count || 0) + (e.alhamdulillah_count || 0) +
    (e.allahu_akbar_count || 0) + (e.la_ilaha_count || 0) + (e.astaghfirullah_count || 0), 0);
  const salawat = entries.reduce((s, e) => s + (e.salawat_count || 0), 0);
  const pages = entries.reduce((s, e) => s + (e.morning_pages || 0) + (e.evening_pages || 0), 0);
  const daysAll5 = entries.filter((e) =>
    [e.bomdod, e.peshin, e.asr, e.shom, e.xufton].filter(Boolean).length === 5).length;

  return [
    { id: 'c_first',      icon: '🌱',     title: 'Birinchi Qadam',   desc: 'Birinchi kunlik yozuv kiritildi',      earned: entries.length >= 1 },
    { id: 'c_days5',      icon: '📅',     title: '5 Kun',            desc: '5 kun davomida ma\'lumot kiritildi',    earned: entries.length >= 5 },
    { id: 'c_days30',     icon: '📆',     title: 'Bir Oy',           desc: '30 kun davomida ma\'lumot kiritildi',   earned: entries.length >= 30 },
    { id: 'c_streak3',    icon: '🔥',     title: '3 Kunlik Streak',  desc: '3 kun ketma-ket 5/5 namoz',            earned: streak >= 3 },
    { id: 'c_streak7',    icon: '🔥🔥',   title: 'Haftalik Streak',  desc: '7 kun ketma-ket 5/5 namoz',            earned: streak >= 7 },
    { id: 'c_streak30',   icon: '⚡',     title: 'Oylik Streak',     desc: '30 kun ketma-ket 5/5 namoz',           earned: streak >= 30 },
    { id: 'c_namoz10',    icon: '🕌',     title: 'Namozchi',         desc: '10 kun 5/5 namoz o\'qildi',            earned: daysAll5 >= 10 },
    { id: 'c_namoz25',    icon: '🕌✨',   title: 'Komil Namozchi',   desc: '25 kun 5/5 namoz o\'qildi',            earned: daysAll5 >= 25 },
    { id: 'c_zikr10k',    icon: '💎',     title: 'Zikr Ustasi',      desc: 'Jami 10,000 ta zikr aytildi',          earned: zikr >= 10000 },
    { id: 'c_zikr50k',    icon: '💎💎',   title: 'Zikr Sultoni',     desc: 'Jami 50,000 ta zikr aytildi',          earned: zikr >= 50000 },
    { id: 'c_salawat3k',  icon: '💚',     title: 'Salovat Ustasi',   desc: 'Jami 3,000 ta salovat aytildi',        earned: salawat >= 3000 },
    { id: 'c_salawat10k', icon: '💚💚',   title: 'Salovat Sultoni',  desc: 'Jami 10,000 ta salovat aytildi',       earned: salawat >= 10000 },
    { id: 'c_pages100',   icon: '📚',     title: 'O\'quvchi',        desc: 'Jami 100 ta sahifa o\'qildi',          earned: pages >= 100 },
    { id: 'c_pages500',   icon: '📚✨',   title: 'Kitobxon',         desc: 'Jami 500 ta sahifa o\'qildi',          earned: pages >= 500 },
    { id: 'c_pages1000',  icon: '🎓',     title: 'Olim',             desc: 'Jami 1,000 ta sahifa o\'qildi',        earned: pages >= 1000 },
  ];
}

// ───────────────────────────────────────
// localStorage — cumulative award history
// ───────────────────────────────────────

export function getAwardHistory(userId: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`award_history_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function updateAwardHistory(userId: string, awards: CumulativeAward[], todayStr: string): void {
  if (typeof window === 'undefined') return;
  const history = getAwardHistory(userId);
  let changed = false;
  for (const a of awards) {
    if (a.earned && !history[a.id]) {
      history[a.id] = todayStr;
      changed = true;
    }
  }
  if (changed) localStorage.setItem(`award_history_${userId}`, JSON.stringify(history));
}

// ───────────────────────────────────────
// Motivational quotes (rotated by day)
// ───────────────────────────────────────

const QUOTES = [
  { arabic: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ', uzbek: 'Namozni to\'la o\'qinglar va zakot beringlar (Baqara: 110)' },
  { arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ', uzbek: 'Meni zikr qilinglar, Men ham sizlarni zikr qilaman (Baqara: 152)' },
  { arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', uzbek: 'Albatta, qiyinchilik bilan birga yengillik bor (Inshiroh: 6)' },
  { arabic: 'وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ', uzbek: 'Oziq-ovqat olinglar, eng yaxshi oziq — taqvo (Baqara: 197)' },
  { arabic: 'مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ', uzbek: 'Kim Alloh kitobidan bir harf o\'qisa, unga yaxshilik (savob) bor (Tirmiziy)' },
  { arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا', uzbek: 'Allohga eng mahbub amal — oz bo\'lsa-da doimiy qilingan (Bukhoriy)' },
  { arabic: 'الصَّلَوَاتُ الخَمْسُ كَفَّارَةٌ لِمَا بَيْنَهُنَّ', uzbek: 'Besh vaqt namoz ular orasidagi gunohlarga kaffora bo\'ladi (Muslim)' },
];

export function getTodayQuote(dateStr: string): { arabic: string; uzbek: string } {
  const day = parseInt(dateStr.replace(/-/g, '')) % QUOTES.length;
  return QUOTES[day];
}
