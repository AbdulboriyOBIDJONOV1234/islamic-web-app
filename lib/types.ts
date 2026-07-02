export interface User {
  id: string;
  name: string;
  created_at: string;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  date: string;
  bomdod: boolean;
  peshin: boolean;
  asr: boolean;
  shom: boolean;
  xufton: boolean;
  dhikr_count: number;
  salawat_count: number;
  subhanallah_count: number;
  alhamdulillah_count: number;
  allahu_akbar_count: number;
  la_ilaha_count: number;
  astaghfirullah_count: number;
  salawat_notes: string;
  morning_pages: number;
  evening_pages: number;
  book_name: string;
  created_at: string;
  updated_at: string;
}

export const DHIKR_TYPES = [
  { key: 'subhanallah_count', label: 'SubhanAlloh', arabic: 'سُبْحَانَ اللَّهِ', suggested: 33 },
  { key: 'alhamdulillah_count', label: 'Alhamdulilloh', arabic: 'الْحَمْدُ لِلَّهِ', suggested: 33 },
  { key: 'allahu_akbar_count', label: 'Allohu Akbar', arabic: 'اللَّهُ أَكْبَرُ', suggested: 34 },
  { key: 'la_ilaha_count', label: 'La ilaha illalloh', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', suggested: 100 },
  { key: 'astaghfirullah_count', label: 'Astaghfirulloh', arabic: 'أَسْتَغْفِرُ اللَّهَ', suggested: 100 },
] as const;

export const SALAWAT_OPTIONS = [
  { label: 'Allohumma solli ala Muhammad', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ' },
  { label: 'Sollallohu alayhi vasallam', arabic: 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ' },
  { label: 'Allohumma solli va sallim', arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ' },
];

export interface DailyStats {
  date: string;
  namoz_count: number;
  dhikr_count: number;
  salawat_count: number;
  missed_count: number;
}

export type Prayer = 'bomdod' | 'peshin' | 'asr' | 'shom' | 'xufton';

export const PRAYERS: { key: Prayer; label: string; arabic: string; time: string }[] = [
  { key: 'bomdod', label: 'Bomdod', arabic: 'الفجر', time: '05:00' },
  { key: 'peshin', label: "Peshin", arabic: 'الظهر', time: '13:00' },
  { key: 'asr', label: 'Asr', arabic: 'العصر', time: '16:30' },
  { key: 'shom', label: "Shom", arabic: 'المغرب', time: '19:30' },
  { key: 'xufton', label: 'Xufton', arabic: 'العشاء', time: '21:00' },
];

export const DHIKR_LIST = [
  { text: 'SubhanAlloh', arabic: 'سُبْحَانَ اللَّهِ', count: 33 },
  { text: 'Alhamdulilloh', arabic: 'الْحَمْدُ لِلَّهِ', count: 33 },
  { text: 'Allohu Akbar', arabic: 'اللَّهُ أَكْبَرُ', count: 34 },
  { text: 'La ilaha illalloh', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', count: 100 },
  { text: 'Astaghfirulloh', arabic: 'أَسْتَغْفِرُ اللَّهَ', count: 100 },
];

export const SALAWAT_LIST = [
  {
    text: 'Allohumma solli ala Muhammad',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    count: 100,
  },
  {
    text: 'Sollallohu alayhi vasallam',
    arabic: 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ',
    count: 100,
  },
];
