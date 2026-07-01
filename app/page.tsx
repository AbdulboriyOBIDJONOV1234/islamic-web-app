'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByName, createUser, getAllUsers } from '@/lib/supabase';
import { setSession } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Iltimos, ismingizni kiriting");
      return;
    }

    setLoading(true);
    setError('');

    try {
      let user = await getUserByName(trimmed);

      if (!user) {
        const allUsers = await getAllUsers();
        if (allUsers.length >= 2) {
          setError("Bu ilovada faqat 2 kishi ro'yxatdan o'ta oladi. Ismingizni tekshiring.");
          setLoading(false);
          return;
        }
        user = await createUser(trimmed);
      }

      setSession({ id: user.id, name: user.name });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 login-bg">
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">☽</div>
          <h1 className="text-3xl font-bold text-white mb-1">بِسْمِ اللَّهِ</h1>
          <p className="text-green-200 text-sm">Bismillahir Rohmanir Rohiym</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center mb-1 login-title">
            Namoz Tracker
          </h2>
          <p className="text-gray-500 text-center text-sm mb-8">
            Kunlik namoz, zikr va salovotlaringizni kuzating
          </p>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-green-800">
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
            <div className="mb-4 p-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading || !name.trim()}
            className="btn-primary"
          >
            {loading ? '⏳ Yuklanmoqda...' : 'Kirish →'}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              Yangi foydalanuvchi bo&apos;lsangiz avtomatik ro&apos;yxatdan o&apos;tasiz
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-green-100 font-medium text-lg arabic-text">
            اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ
          </p>
          <p className="mt-1 text-xs text-green-200 opacity-80">
            Allohhumma solli ala Muhammad ﷺ
          </p>
        </div>
      </div>
    </div>
  );
}
