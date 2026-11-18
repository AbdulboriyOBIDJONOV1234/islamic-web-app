export interface Dua {
  id: number;
  name: string;
  arabic: string;
  uzbek: string;
}

export const MORNING_DUAS: Dua[] = [
  {
    id: 0,
    name: "Uyg'onish duosi",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    uzbek: "Bizni o'ldirganidan so'ng tiriltirgan va qaytish Unga bo'lgan Allohga hamd bo'lsin",
  },
  {
    id: 1,
    name: "SubhanAlloh zikri (100 marta)",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    uzbek: "SubhanAllohi vabihamdihi — 100 marta",
  },
  {
    id: 2,
    name: "La ilaha illAlloh zikri (100 marta)",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    uzbek: "La ilaha illAllohu vahdahu la sharika lahu — 100 marta",
  },
  {
    id: 3,
    name: "Sayyidul istighfor",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ",
    uzbek: "Allohim, Sen mening Rabbimsan, Sendan o'zga iloh yo'q, Sen meni yaratding va men Sening bandangman",
  },
  {
    id: 4,
    name: "Ertalabki azkor",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ",
    uzbek: "Biz tong otdik, mulk ham Allohniki, hamd ham Allohga",
  },
  {
    id: 5,
    name: "Oyatul Kursiy",
    arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    uzbek: "Oyatul Kursiy o'qish — Alloh, Undan o'zga iloh yo'q, U Hayyul Qayyum",
  },
  {
    id: 6,
    name: "3 Qul suralari (3 martadan)",
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    uzbek: "Al-Ixlos, Al-Falaq, An-Nos — har birini 3 martadan",
  },
  {
    id: 7,
    name: "Balo-qazadan himoya duosi",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ",
    uzbek: "Ismiga biron narsa zarar berolmaydigan Alloh nomi bilan — 3 marta",
  },
];

export const EVENING_DUAS: Dua[] = [
  {
    id: 0,
    name: "Kechki azkor",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ",
    uzbek: "Kechqurun ham mulk Allohniki, hamd ham Allohga",
  },
  {
    id: 1,
    name: "3 Qul suralari (kechqurun, 3 martadan)",
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    uzbek: "Al-Ixlos, Al-Falaq, An-Nos — har birini 3 martadan",
  },
  {
    id: 2,
    name: "Oyatul Kursiy (kechqurun)",
    arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    uzbek: "Yotishdan oldin Oyatul Kursiy o'qish",
  },
  {
    id: 3,
    name: "Uxlash duosi",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    uzbek: "Bismika Allohumma amutu va ahya — Sening isming bilan o'laman va yashayman",
  },
  {
    id: 4,
    name: "Al-Baqara oxirgi 2 oyat",
    arabic: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ",
    uzbek: "Al-Baqara surasi — 285–286-oyatlar",
  },
  {
    id: 5,
    name: "SubhanAlloh zikri (kechqurun, 100 marta)",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    uzbek: "SubhanAllohi vabihamdihi — 100 marta",
  },
  {
    id: 6,
    name: "Kechqurun istighfor (100 marta)",
    arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    uzbek: "Astaghfirulloha va atubu ilayhi — 100 marta",
  },
];
