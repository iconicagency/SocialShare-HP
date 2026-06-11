'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, XCircle, AlertCircle, Share2, Loader2, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { platforms } from '@/lib/platforms';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/firebase-provider';

interface Account {
  id: string;
  platformId: string;
  name: string;
  status: 'active' | 'error' | 'disconnected';
  lastSync: any;
  ownerId: string;
}

export default function Accounts() {
  const { user, login } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      return;
    }
    const q = query(collection(db, 'accounts'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Account[];
      setAccounts(data);
    }, (err) => {
      console.error('Firestore accounts error:', err);
      setError('Could not load accounts. Check Firestore rules.');
    });
    return () => unsubscribe();
  }, [user]);

  const connectPlatform = async (platformId: string) => {
    if (!user) return;
    setIsConnecting(platformId);
    setError(null);
    try {
      const platform = platforms.find(p => p.id === platformId);
      await addDoc(collection(db, 'accounts'), {
        platformId,
        name: user.displayName ? `${user.displayName}'s ${platform?.name}` : `${platform?.name} Profile`,
        status: 'active',
        lastSync: serverTimestamp(),
        ownerId: user.uid,
      });
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(`Failed to add account: ${err.message}`);
    } finally {
      setIsConnecting(null);
    }
  };

  const disconnectAccount = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (err: any) {
      setError(`Failed to disconnect: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Share2 className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Sign in to manage accounts</h3>
        <p className="text-gray-500 mt-2 mb-6">Connect your social media profiles to start automating your content.</p>
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
          Social Accounts
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your connected social media profiles and pages.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Available Platforms */}
      <div>
        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Available Platforms</h3>
        <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.slice(0, 12).map((platform) => {
            const isConnected = accounts.some(a => a.platformId === platform.id);
            const isThisConnecting = isConnecting === platform.id;
            return (
              <li key={platform.id} className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
                <div className="flex w-full items-center justify-between space-x-6 p-6">
                  <div className="flex-1 truncate">
                    <div className="flex items-center space-x-3">
                      <h3 className="truncate text-sm font-medium text-gray-900">{platform.name}</h3>
                      {isConnected && (
                        <span className="inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Connected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', platform.color)}>
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={platform.icon} />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="-mt-px flex divide-x divide-gray-200">
                    <div className="flex w-0 flex-1">
                      <button
                        onClick={() => !isConnected && connectPlatform(platform.id)}
                        disabled={isConnecting !== null || isConnected}
                        className={cn(
                          'relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold',
                          isConnected
                            ? 'text-green-600 cursor-default'
                            : 'text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {isThisConnecting ? (
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                        ) : isConnected ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Plus className="h-5 w-5 text-gray-400" />
                        )}
                        {isThisConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Connected Accounts */}
      <div>
        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Connected Accounts</h3>
        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No accounts connected</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by connecting a platform above.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {accounts.map((account) => {
                const platform = platforms.find(p => p.id === account.platformId);
                return (
                  <li key={account.id}>
                    <div className="flex items-center px-4 py-4 sm:px-6">
                      <div className="flex min-w-0 flex-1 items-center">
                        <div className="flex-shrink-0">
                          <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', platform?.color || 'bg-gray-500')}>
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
                            <p className="text-sm text-gray-900">
                              Last synced {account.lastSync?.toDate ? account.lastSync.toDate().toLocaleString() : 'Just now'}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500">
                              {account.status === 'active' ? (
                                <CheckCircle2 className="mr-1.5 h-5 w-5 flex-shrink-0 text-green-400" />
                              ) : account.status === 'error' ? (
                                <AlertCircle className="mr-1.5 h-5 w-5 flex-shrink-0 text-red-400" />
                              ) : (
                                <XCircle className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                              )}
                              {account.status === 'active' ? 'Active' : account.status === 'error' ? 'Needs Attention' : 'Disconnected'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => disconnectAccount(account.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-500"
                      >
                        Disconnect
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
