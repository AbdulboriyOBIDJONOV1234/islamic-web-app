'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setSession } from '@/lib/utils';

type Step = 'name' | 'login' | 'register';
type Eye = 'password' | 'text';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState<Eye>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ALLOWED = ['abdulboriy', 'mohinur'];

  async function handleNameNext() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Ismingizni kiriting'); return; }
    if (!ALLOWED.includes(trimmed.toLowerCase())) {
      setError('Bu ilova faqat Abdulboriy va Mohinur uchun');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', name: trimmed }),
      });
      const data = await res.json();
      setStep(data.exists ? 'login' : 'register');
    } catch {
      setError('Tarmoq xatosi. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!password) { setError('Parolni kiriting'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSession(data.user);
      router.push('/dashboard');
    } catch {
      setError('Xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (password.length < 4) { setError('Parol kamida 4 ta belgi'); return; }
    if (password !== confirm) { setError('Parollar mos kelmadi'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSession(data.user);
      router.push('/dashboard');
    } catch {
      setError('Xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen login-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☽</div>
          <h1 className="text-3xl font-black gold-text mb-1">بِسْمِ اللَّهِ</h1>
          <p className="text-green-300 text-xs tracking-widest">BISMILLAHIR ROHMANIR ROHIYM</p>
        </div>

        {/* Card */}
        <div className="card-glass p-7">
          <h2 className="text-xl font-black text-white text-center mb-1">Namoz Tracker</h2>
          <p className="text-green-300 text-xs text-center mb-6">Kunlik namoz · Zikr · Salovat · Kitob</p>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-1 rounded-full bg-green-500" />
            <div className={`flex-1 h-1 rounded-full ${step !== 'name' ? 'bg-green-500' : 'bg-white/20'}`} />
          </div>

          {/* STEP 1: Ism */}
          {step === 'name' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-green-300 uppercase tracking-wider block mb-2">
                  Ismingiz
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
                  placeholder="Ismingizni kiriting..."
                  className={`input-name ${name ? 'has-value' : ''}`}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-300 text-xs bg-red-900/30 p-3 rounded-xl">{error}</p>}
              <button type="button" onClick={handleNameNext} disabled={loading || !name.trim()} className="btn-primary">
                {loading ? '⏳...' : 'Davom etish →'}
              </button>
            </div>
          )}

          {/* STEP 2A: Login */}
          {step === 'login' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-white font-bold text-lg">{name}</p>
                <p className="text-green-400 text-xs">Xush kelibsiz! Parolingizni kiriting</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-green-300 uppercase tracking-wider block mb-2">
                  Parol
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className={`input-name ${password ? 'has-value' : ''}`}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-300 text-xs bg-red-900/30 p-3 rounded-xl">{error}</p>}
              <button type="button" onClick={handleLogin} disabled={loading || !password} className="btn-primary">
                {loading ? '⏳ Tekshirilmoqda...' : '🔓 Kirish'}
              </button>
              <button type="button" onClick={() => { setStep('name'); setPassword(''); setError(''); }}
                className="w-full text-center text-green-400 text-xs py-2">
                ← Orqaga
              </button>
            </div>
          )}

          {/* STEP 2B: Register */}
          {step === 'register' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-white font-bold text-lg">{name}</p>
                <p className="text-green-400 text-xs">Yangi foydalanuvchi — parol yarating</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-green-300 uppercase tracking-wider block mb-2">
                  Yangi parol
                </label>
                <div className="relative">
                  <input
                    type={showPass}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Kamida 4 ta belgi"
                    className={`input-name ${password ? 'has-value' : ''}`}
                    autoFocus
                  />
                  <button type="button"
                    onClick={() => setShowPass(showPass === 'password' ? 'text' : 'password')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-lg">
                    {showPass === 'password' ? '👁' : '🙈'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-green-300 uppercase tracking-wider block mb-2">
                  Parolni tasdiqlang
                </label>
                <input
                  type={showPass}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  placeholder="••••••••"
                  className={`input-name ${confirm ? 'has-value' : ''}`}
                />
              </div>
              {error && <p className="text-red-300 text-xs bg-red-900/30 p-3 rounded-xl">{error}</p>}
              <button type="button" onClick={handleRegister} disabled={loading || !password || !confirm} className="btn-primary">
                {loading ? '⏳ Saqlanmoqda...' : '✓ Ro\'yxatdan o\'tish'}
              </button>
              <button type="button" onClick={() => { setStep('name'); setPassword(''); setConfirm(''); setError(''); }}
                className="w-full text-center text-green-400 text-xs py-2">
                ← Orqaga
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="gold-salawat text-lg">اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ</p>
          <p className="text-green-400/60 text-xs mt-1">Allohhumma solli ala Muhammad ﷺ</p>
        </div>
      </div>
    </div>
  );
}
