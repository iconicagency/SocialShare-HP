'use client';

import { useState, useEffect } from 'react';
import { Rss, Globe, Link as LinkIcon, Plus, Trash2, RefreshCw, Loader2, CheckCircle2, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, writeBatch, updateDoc } from 'firebase/firestore';
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
  const { user, login } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingSourceId, setFetchingSourceId] = useState<string | null>(null);
  const [fetchedItems, setFetchedItems] = useState<FetchedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'sources'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Source[];
      setSources(data);
    }, (err) => {
      console.error('Sources error:', err);
      setError('Could not load sources. Check Firestore rules.');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'items'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as FetchedItem[];
      setFetchedItems(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50));
    });
    return () => unsubscribe();
  }, [user]);

  const doFetch = async (url: string) => {
    if (!url || !user) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await fetch('/api/fetch-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch content');

      // Add/update source
      const existingSource = sources.find(s => s.url === url);
      let sourceId = existingSource?.id;

      if (!existingSource) {
        const hostname = new URL(url).hostname;
        const newRef = await addDoc(collection(db, 'sources'), {
          type: data.type,
          name: data.items[0]?.source || hostname,
          url,
          status: 'active',
          lastFetch: serverTimestamp(),
          itemsCount: data.items.length,
          ownerId: user.uid,
        });
        sourceId = newRef.id;
      } else {
        await updateDoc(doc(db, 'sources', existingSource.id), {
          lastFetch: serverTimestamp(),
          itemsCount: data.items.length,
          status: 'active',
        });
      }

      // Batch write new items
      const existingUrls = new Set(fetchedItems.map(i => i.url));
      const newItems = data.items.filter((item: any) => !existingUrls.has(item.url));

      if (newItems.length > 0) {
        const batch = writeBatch(db);
        newItems.forEach((item: any) => {
          const itemRef = doc(collection(db, 'items'));
          batch.set(itemRef, { ...item, ownerId: user.uid, sourceId });
        });
        await batch.commit();
        setSuccessMsg(`✓ Added ${newItems.length} new item(s) from ${new URL(url).hostname}`);
      } else {
        setSuccessMsg(`✓ No new items found — already up to date`);
      }

      setUrlInput('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
      setFetchingSourceId(null);
    }
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    await doFetch(urlInput);
  };

  const refreshSource = async (source: Source) => {
    setFetchingSourceId(source.id);
    await doFetch(source.url);
  };

  const removeSource = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'sources', id));
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Globe className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Sign in to manage sources</h3>
        <p className="text-gray-500 mt-2 mb-6">Connect your account to start fetching and sharing content.</p>
        <button
          onClick={login}
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <LogIn className="h-4 w-4" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Content Sources
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Add websites or RSS feeds to automatically fetch content for sharing.
        </p>
      </div>

      {/* Add New Source Form */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" /> : <Plus className="mr-2 h-5 w-5 text-gray-400" />}
            Add a new content source
          </h3>
          <p className="mt-2 max-w-xl text-sm text-gray-500">
            Enter a website URL or RSS feed URL. We will automatically detect the type and fetch content.
          </p>
          <form className="mt-5 sm:flex sm:items-center" onSubmit={handleFetch}>
            <div className="w-full sm:max-w-md">
              <label htmlFor="url" className="sr-only">URL</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  name="url"
                  id="url"
                  required
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="https://example.com/feed or https://example.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !urlInput}
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Fetching...' : 'Fetch Content'}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          {successMsg && <p className="mt-3 text-sm text-green-600 bg-green-50 rounded p-2">{successMsg}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Active Sources */}
        <div className="lg:col-span-2">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Active Sources</h3>
          {sources.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
              <Rss className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No sources added yet</h3>
              <p className="mt-1 text-sm text-gray-500">Add a URL above to get started.</p>
            </div>
          ) : (
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
                            <p className="mt-1 text-xs text-gray-400 truncate">{source.url}</p>
                          </div>
                          <div className="hidden md:block">
                            <p className="text-sm text-gray-500">
                              Last fetched: {source.lastFetch?.toDate ? source.lastFetch.toDate().toLocaleString() : 'Never'}
                            </p>
                            <p className="mt-1 flex items-center gap-2 text-sm">
                              <span className={cn(
                                'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                                source.status === 'active'
                                  ? 'bg-green-50 text-green-700 ring-green-600/20'
                                  : 'bg-red-50 text-red-700 ring-red-600/10'
                              )}>
                                {source.status === 'active' ? 'Active' : 'Error'}
                              </span>
                              <span className="text-gray-500">{source.itemsCount} items</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <button
                          onClick={() => refreshSource(source)}
                          disabled={isLoading}
                          className="text-gray-400 hover:text-indigo-600 disabled:opacity-40"
                          title="Refresh"
                        >
                          <RefreshCw className={cn('h-5 w-5', fetchingSourceId === source.id && 'animate-spin')} />
                        </button>
                        <button
                          onClick={() => removeSource(source.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recently Fetched Items */}
        <div>
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4 flex items-center">
            <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
            Recently Found
          </h3>
          <div className="bg-white shadow sm:rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
            <ul role="list" className="divide-y divide-gray-200">
              {fetchedItems.length === 0 ? (
                <li className="p-6 text-center text-gray-500 text-sm italic">No items found yet.</li>
              ) : (
                fetchedItems.map((item) => (
                  <li key={item.id} className="p-4 hover:bg-gray-50">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="group">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1">{item.source} · {new Date(item.date).toLocaleDateString()}</p>
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
