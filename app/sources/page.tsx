'use client';

import { useState, useEffect } from 'react';
import { Rss, Globe, Link as LinkIcon, Plus, Trash2, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/components/firebase-provider';

interface FetchedItem {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  date: string;
  image?: string;
  ownerId: string;
}

interface Source {
  id: string;
  type: 'rss' | 'website';
  name: string;
  url: string;
  status: 'active' | 'error';
  lastFetch: any;
  itemsCount: number;
}

export default function Sources() {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedItems, setFetchedItems] = useState<FetchedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync Sources from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'sources'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sourcesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Source[];
      setSources(sourcesData);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Fetched Items from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'items'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FetchedItem[];
      // Sort by date descending
      setFetchedItems(itemsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50));
    });

    return () => unsubscribe();
  }, [user]);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput || !user) return;

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

      // 1. Add to sources if new
      let sourceId = sources.find(s => s.url === urlInput)?.id;
      if (!sourceId) {
        const hostname = new URL(urlInput).hostname;
        const newSourceRef = await addDoc(collection(db, 'sources'), {
          type: data.type,
          name: data.items[0]?.source || hostname,
          url: urlInput,
          status: 'active',
          lastFetch: serverTimestamp(),
          itemsCount: data.items.length,
          ownerId: user.uid
        });
        sourceId = newSourceRef.id;
      }

      // 2. Add items to Firestore (batch)
      const batch = writeBatch(db);
      const existingUrls = new Set(fetchedItems.map(i => i.url));
      
      data.items.forEach((item: any) => {
        if (!existingUrls.has(item.url)) {
          const itemRef = doc(collection(db, 'items'));
          batch.set(itemRef, {
            ...item,
            ownerId: user.uid,
            sourceId: sourceId
          });
        }
      });
      
      await batch.commit();
      setUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSource = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'sources', id));
      // Optionally clean up items, but Firestore rules handle access
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Globe className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Sign in to manage sources</h3>
        <p className="text-gray-500 mt-2">Connect your account to start fetching and sharing content.</p>
      </div>
    );
  }

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
                            <p className="text-sm text-gray-900">
                              Last fetched {source.lastFetch?.toDate ? source.lastFetch.toDate().toLocaleString() : 'Never'}
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
                              <span className="ml-2">{source.itemsCount} items found</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button 
                        type="button" 
                        onClick={() => {
                          setUrlInput(source.url);
                          // Trigger fetch
                          const form = document.querySelector('form');
                          if (form) form.requestSubmit();
                        }}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                      >
                        <RefreshCw className={cn("h-5 w-5", isLoading && urlInput === source.url && "animate-spin")} />
                      </button>
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

