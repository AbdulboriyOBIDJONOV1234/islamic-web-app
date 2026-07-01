'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen login-bg flex flex-col items-center justify-center px-4">
      <div className="card-glass p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-white font-black text-xl mb-2">Sahifa yuklanmadi</h2>
        <p className="text-green-300 text-sm mb-6">
          Tarmoq muammosi yoki sahifa xatosi. Qayta urinib ko&apos;ring.
        </p>
        <button
          type="button"
          onClick={reset}
          className="btn-primary mb-3"
        >
          🔄 Qayta yuklash
        </button>
        <a
          href="/dashboard"
          className="block text-green-400 text-sm mt-2"
        >
          ← Bosh sahifaga qaytish
        </a>
      </div>
    </div>
  );
}
