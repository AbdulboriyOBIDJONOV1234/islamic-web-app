'use client';

import { useRef } from 'react';

// Sichqoncha/barmoq harakatiga qarab kartochkani 3D burib turadi
export default function Tilt({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
  }
  function leave() {
    if (ref.current) ref.current.style.transform = '';
  }

  return (
    <div ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </div>
  );
}
