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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
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
      </div>
    </nav>
  );
}
