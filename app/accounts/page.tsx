'use client';

import { useState } from 'react';
import { Plus, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { platforms } from '@/lib/platforms';

const initialAccounts = [
  { id: 1, platform: 'facebook', name: 'My Business Page', status: 'active', lastSync: '2 hours ago' },
  { id: 2, platform: 'twitter', name: '@mybusiness', status: 'active', lastSync: '1 hour ago' },
  { id: 3, platform: 'linkedin', name: 'Company Profile', status: 'error', lastSync: '2 days ago' },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState(initialAccounts);

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Social Accounts
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your connected social media profiles and pages.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Account
          </button>
        </div>
      </div>

      {/* Available Platforms */}
      <div>
        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Available Platforms</h3>
        <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.map((platform) => (
            <li key={platform.id} className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
              <div className="flex w-full items-center justify-between space-x-6 p-6">
                <div className="flex-1 truncate">
                  <div className="flex items-center space-x-3">
                    <h3 className="truncate text-sm font-medium text-gray-900">{platform.name}</h3>
                  </div>
                </div>
                <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full", platform.color)}>
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={platform.icon} />
                  </svg>
                </div>
              </div>
              <div>
                <div className="-mt-px flex divide-x divide-gray-200">
                  <div className="flex w-0 flex-1">
                    <button
                      className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      <Plus className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Connected Accounts */}
      <div>
        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Connected Accounts</h3>
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {accounts.map((account) => {
              const platform = platforms.find(p => p.id === account.platform);
              return (
                <li key={account.id}>
                  <div className="flex items-center px-4 py-4 sm:px-6">
                    <div className="flex min-w-0 flex-1 items-center">
                      <div className="flex-shrink-0">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", platform?.color || 'bg-gray-500')}>
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={platform?.icon || ''} />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                        <div>
                          <p className="truncate text-sm font-medium text-indigo-600">{account.name}</p>
                          <p className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="truncate">{platform?.name}</span>
                          </p>
                        </div>
                        <div className="hidden md:block">
                          <div>
                            <p className="text-sm text-gray-900">
                              Last synced <time dateTime={account.lastSync}>{account.lastSync}</time>
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500">
                              {account.status === 'active' ? (
                                <CheckCircle2 className="mr-1.5 h-5 w-5 flex-shrink-0 text-green-400" aria-hidden="true" />
                              ) : account.status === 'error' ? (
                                <AlertCircle className="mr-1.5 h-5 w-5 flex-shrink-0 text-red-400" aria-hidden="true" />
                              ) : (
                                <XCircle className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                              )}
                              {account.status === 'active' ? 'Active' : account.status === 'error' ? 'Needs Attention' : 'Disconnected'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button className="text-sm font-medium text-red-600 hover:text-red-500">
                        Disconnect
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
