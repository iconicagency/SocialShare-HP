'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Share2,
  Globe,
  PenTool,
  History,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Social Accounts', href: '/accounts', icon: Share2 },
  { name: 'Content Sources', href: '/sources', icon: Globe },
  { name: 'Composer', href: '/composer', icon: PenTool },
  { name: 'History', href: '/history', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Share2 className="h-8 w-8 text-indigo-600" />
        <span className="ml-3 text-xl font-bold text-gray-900">SocialSync</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                    'mr-3 h-5 w-5 shrink-0 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <Link
            href="/settings"
            className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
          >
            <Settings
              className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-indigo-600 transition-colors"
              aria-hidden="true"
            />
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
