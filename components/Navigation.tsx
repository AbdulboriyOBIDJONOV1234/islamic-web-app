'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', icon: '🕌', label: 'Bosh sahifa' },
  { href: '/entry', icon: '📝', label: 'Kiritish' },
  { href: '/statistics', icon: '📊', label: 'Statistika' },
  { href: '/partner', icon: '👤', label: 'Hamkor' },
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
            <span className="text-2xl">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
