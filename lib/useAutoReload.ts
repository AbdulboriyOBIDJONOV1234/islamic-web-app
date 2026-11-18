import { useEffect, useRef } from 'react';

// Sahifa ma'lumotini avtomatik yangilaydi:
//  - brauzer/ilovaga qaytganda va oynaga fokus berilganda har doim,
//  - `polling` yoqilgan bo'lsa (masalan, hamkor hali qo'shilmagan) har 10 soniyada.
export function useAutoReload(reload: () => void, polling: boolean, ms = 10_000) {
  const ref = useRef(reload);
  useEffect(() => { ref.current = reload; });

  useEffect(() => {
    const run = () => ref.current();
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', run);
    const timer = polling ? setInterval(run, ms) : undefined;
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', run);
      if (timer) clearInterval(timer);
    };
  }, [polling, ms]);
}
