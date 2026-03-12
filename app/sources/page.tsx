'use client';

import { useState } from 'react';
import { Rss, Globe, Link as LinkIcon, Plus, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const initialSources = [
  { id: 1, type: 'rss', name: 'Tech Blog RSS', url: 'https://techblog.com/feed', status: 'active', lastFetch: '10 mins ago', items: 145 },
  { id: 2, type: 'website', name: 'Company News', url: 'https://mycompany.com/news', status: 'active', lastFetch: '1 hour ago', items: 32 },
  { id: 3, type: 'rss', name: 'Industry Updates', url: 'https://industry.com/rss', status: 'error', lastFetch: '2 days ago', items: 0 },
];

export default function Sources() {
  const [sources, setSources] = useState(initialSources);

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Content Sources
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Add websites or RSS feeds to automatically fetch content for sharing.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Add Source
          </button>
        </div>
      </div>

      {/* Add New Source Form (Mock) */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Add a new content source</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Enter a website URL or an RSS feed URL. We will automatically detect the type and start fetching content.</p>
          </div>
          <form className="mt-5 sm:flex sm:items-center">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="url" className="sr-only">
                URL
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LinkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="url"
                  name="url"
                  id="url"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="https://example.com/feed"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Active Sources List */}
      <div className="bg-white shadow sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {sources.map((source) => (
            <li key={source.id}>
              <div className="flex items-center px-4 py-4 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center">
                  <div className="flex-shrink-0">
                    <span
                      className={cn(
                        source.type === 'rss' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600',
                        'inline-flex h-12 w-12 items-center justify-center rounded-lg'
                      )}
                    >
                      {source.type === 'rss' ? (
                        <Rss className="h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Globe className="h-6 w-6" aria-hidden="true" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                    <div>
                      <p className="truncate text-sm font-medium text-indigo-600">{source.name}</p>
                      <p className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="truncate">{source.url}</span>
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div>
                        <p className="text-sm text-gray-900">
                          Fetched <time dateTime={source.lastFetch}>{source.lastFetch}</time>
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500">
                          {source.status === 'active' ? (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                              Error
                            </span>
                          )}
                          <span className="ml-2">{source.items} items found</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button type="button" className="text-gray-400 hover:text-indigo-600" title="Fetch Now">
                    <RefreshCw className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button type="button" className="text-gray-400 hover:text-red-600" title="Remove Source">
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
