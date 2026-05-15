'use client';

import { useState, useEffect } from 'react';
import { Rss, Globe, Link as LinkIcon, Plus, Trash2, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FetchedItem {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  date: string;
  image?: string;
}

interface Source {
  id: number;
  type: 'rss' | 'website' | 'system';
  name: string;
  url: string;
  status: 'active' | 'error';
  lastFetch: string;
  items: number;
}

const initialSources: Source[] = [
  { id: 1, type: 'rss', name: 'Tech Blog RSS', url: 'https://techblog.com/feed', status: 'active', lastFetch: '10 mins ago', items: 145 },
  { id: 2, type: 'website', name: 'Company News', url: 'https://mycompany.com/news', status: 'active', lastFetch: '1 hour ago', items: 32 },
];

export default function Sources() {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedItems, setFetchedItems] = useState<FetchedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load fetched items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('socialsync_fetched_items');
    if (saved) {
      try {
        setFetchedItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved items', e);
      }
    }
  }, []);

  // Save fetched items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('socialsync_fetched_items', JSON.stringify(fetchedItems));
  }, [fetchedItems]);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/fetch-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch content');
      }

      // Add to sources if not already there
      const hostname = new URL(urlInput).hostname;
      if (!sources.find(s => s.url === urlInput)) {
        const newSource: Source = {
          id: Date.now(),
          type: data.type,
          name: data.items[0]?.source || hostname,
          url: urlInput,
          status: 'active',
          lastFetch: 'Just now',
          items: data.items.length,
        };
        setSources([newSource, ...sources]);
      }

      // Prepend new items to fetched items
      setFetchedItems(prev => {
        const existingUrls = new Set(prev.map(i => i.url));
        const newItems = data.items.filter((item: FetchedItem) => !existingUrls.has(item.url));
        return [...newItems, ...prev].slice(0, 50); // Keep last 50
      });

      setUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSource = (id: number) => {
    setSources(sources.filter(s => s.id !== id));
  };

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
      </div>

      {/* Add New Source Form */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" /> : <Plus className="mr-2 h-5 w-5 text-gray-400" />}
            Add a new content source
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Enter a website URL or an RSS feed URL. We will automatically detect the type and start fetching content.</p>
          </div>
          <form className="mt-5 sm:flex sm:items-center" onSubmit={handleFetch}>
            <div className="w-full sm:max-w-xs">
              <label htmlFor="url" className="sr-only">URL</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LinkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="url"
                  name="url"
                  id="url"
                  required
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="https://example.com/feed"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto disabled:opacity-50"
            >
              {isLoading ? 'Fetching...' : 'Fetch Content'}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Active Sources List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Active Sources</h3>
          <div className="bg-white shadow sm:rounded-md overflow-hidden">
            <ul role="list" className="divide-y divide-gray-200">
              {sources.map((source) => (
                <li key={source.id}>
                  <div className="flex items-center px-4 py-4 sm:px-6">
                    <div className="flex min-w-0 flex-1 items-center">
                      <div className="flex-shrink-0">
                        <span className={cn(
                          source.type === 'rss' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600',
                          'inline-flex h-12 w-12 items-center justify-center rounded-lg'
                        )}>
                          {source.type === 'rss' ? <Rss className="h-6 w-6" /> : <Globe className="h-6 w-6" />}
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
                            <p className="text-sm text-gray-900">Last fetched {source.lastFetch}</p>
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
                      <button type="button" className="text-gray-400 hover:text-indigo-600"><RefreshCw className="h-5 w-5" /></button>
                      <button type="button" onClick={() => removeSource(source.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recently Fetched Items Panel */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4 flex items-center">
             <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
             Recently Found
          </h3>
          <div className="bg-white shadow sm:rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
            <ul role="list" className="divide-y divide-gray-200">
              {fetchedItems.length === 0 ? (
                <li className="p-6 text-center text-gray-500 text-sm italic">No items found yet. Add a source above to get started.</li>
              ) : (
                fetchedItems.map((item) => (
                  <li key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="group">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1">{item.source} • {new Date(item.date).toLocaleDateString()}</p>
                    </a>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

