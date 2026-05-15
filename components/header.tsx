'use client';

import { Bell, Menu, Search, User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from './firebase-provider';
import Image from 'next/image';

export function Header() {
  const { user, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Search posts, accounts, or sources..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative">
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="-m-1.5 flex items-center p-1.5"
                id="user-menu-button"
              >
                <span className="sr-only">Logout</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 relative overflow-hidden">
                  {user.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt="" 
                      fill 
                      className="rounded-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                    {user.displayName || 'User'}
                  </span>
                  <LogOut className="ml-2 h-4 w-4 text-gray-400" />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={login}
                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <LogIn className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
