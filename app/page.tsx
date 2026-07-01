'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByName, createUser, getAllUsers } from '@/lib/supabase';
import { setSession } from '@/lib/utils';
import Kaaba3D from '@/components/Kaaba3D';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    const trimmed = name.trim();
    if (!trimmed) { setError("Ismingizni kiriting"); return; }
    setLoading(true);
    setError('');
    try {
      let user = await getUserByName(trimmed);
      if (!user) {
        const all = await getAllUsers();
        if (all.length >= 2) {
          setError("Faqat 2 kishi ro'yxatdan o'ta oladi. Ismingizni tekshiring.");
          return;
        }
        user = await createUser(trimmed);
      }
      setSession({ id: user.id, name: user.name });
      router.push('/dashboard');
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen login-bg flex flex-col items-center justify-center px-4 relative">
      <div className="w-full max-w-sm relative z-10 fade-in">

        {/* 3D Kaaba */}
        <div className="mb-6">
          <Kaaba3D />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black gold-text mb-1">بِسْمِ اللَّهِ</h1>
          <p className="text-green-300 text-xs tracking-widest uppercase">
            Bismillahir Rohmanir Rohiym
          </p>
        </div>

        {/* Glass card */}
        <div className="card-glass p-7">
          <h2 className="text-xl font-bold text-white text-center mb-1">Namoz Tracker</h2>
          <p className="text-green-300 text-xs text-center mb-6">
            Kunlik namoz · Zikr · Salovat
          </p>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2 text-green-300 uppercase tracking-wider">
              Ismingiz
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Ismingizni kiriting..."
              className={`input-name ${name ? 'has-value' : ''}`}
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-xs text-red-200 bg-red-900/30 border border-red-500/30">
              {error}
            </div>
          )}

          <button type="button" onClick={handleLogin} disabled={loading || !name.trim()} className="btn-primary">
            {loading ? '⏳ Yuklanmoqda...' : '✦ Kirish'}
          </button>

          <p className="text-center text-xs text-green-400/60 mt-4">
            Yangi foydalanuvchi avtomatik ro&apos;yxatdan o&apos;tadi
          </p>
        </div>

        {/* Salawat footer */}
        <div className="text-center mt-6">
          <p className="text-xl gold-salawat">
            اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ
          </p>
          <p className="text-green-400/60 text-xs mt-1">Allohhumma solli ala Muhammad ﷺ</p>
        </div>
      </div>
    </div>
  );
}
