'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', icon: '🕌', label: 'Bugun' },
  { href: '/entry', icon: '✏️', label: 'Kiritish' },
  { href: '/statistics', icon: '📊', label: 'Statistika' },
  { href: '/quran', icon: '📖', label: 'Diniy' },
  { href: '/mukofotlar', icon: '🏆', label: 'Mukofot' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="dock" aria-label="Asosiy menyu">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`nav-item ${pathname === link.href ? 'nav-item-active' : 'nav-item-inactive'}`}
        >
          <span className="text-xl">{link.icon}</span>
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
