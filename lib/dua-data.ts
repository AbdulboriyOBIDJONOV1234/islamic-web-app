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
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا",
    uzbek: "Bizni o'ldirganidan so'ng tiriltirgan Allohga hamd bo'lsin",
  },
  {
    id: 1,
    name: "Ertalab zikr (SubhanAlloh)",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    uzbek: "SubhanAllohi va bihamdihi — 100 marta",
  },
  {
    id: 2,
    name: "Ertalab La ilaha (100 marta)",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    uzbek: "La ilaha illAllahu wahdahu la sharika lah — 100 marta",
  },
  {
    id: 3,
    name: "Sayyidul istighfor",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ",
    uzbek: "Allohim, Sen mening Rabbimsan, Sendan o'zga iloh yo'q",
  },
  {
    id: 4,
    name: "Erta tonggi dua",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
    uzbek: "Biz tong otdik, mulk esa Allohga tegishli",
  },
  {
    id: 5,
    name: "Ayatul Kursi",
    arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
    uzbek: "Oyatul Kursiy o'qish",
  },
  {
    id: 6,
    name: "3 Qul suralari",
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    uzbek: "Al-Ixlos, Al-Falaq, An-Nos — 3 martadan",
  },
  {
    id: 7,
    name: "Balo-qazadan himoya",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ",
    uzbek: "Bismillahilladhi la yadurru... — 3 marta",
  },
];

export const EVENING_DUAS: Dua[] = [
  {
    id: 0,
    name: "Kechqurun zikr",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
    uzbek: "Kechqurun Allohni zikr qilish",
  },
  {
    id: 1,
    name: "Kechqurun 3 Qul",
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    uzbek: "Al-Ixlos, Al-Falaq, An-Nos — 3 martadan",
  },
  {
    id: 2,
    name: "Ayatul Kursi (kechqurun)",
    arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
    uzbek: "Yotishdan oldin Oyatul Kursiy",
  },
  {
    id: 3,
    name: "Uxlash duosi",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    uzbek: "Bismika Allohuma amutu wa ahya",
  },
  {
    id: 4,
    name: "Al-Baqara oxiri",
    arabic: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ",
    uzbek: "Al-Baqara surasi oxirgi 2 oyat",
  },
  {
    id: 5,
    name: "SubhanAlloh (kechqurun)",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    uzbek: "SubhanAllohi va bihamdihi — 100 marta",
  },
  {
    id: 6,
    name: "Kechqurun istighfor",
    arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    uzbek: "Astaghfirullaha wa atubu ilayhi — 100 marta",
  },
];
