'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, XCircle, AlertCircle, Share2, Loader2, LogIn, Trash2, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { platforms } from '@/lib/platforms';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/firebase-provider';

interface Account {
  id: string;
  platformId: string;
  name: string;
  handle: string;
  profileUrl: string;
  status: 'active' | 'error' | 'disconnected';
  lastSync: any;
  ownerId: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const DISPLAYED_PLATFORMS = [
  'facebook', 'twitter', 'linkedin', 'instagram',
  'youtube', 'tiktok', 'pinterest', 'telegram',
  'reddit', 'threads', 'bluesky', 'wordpress',
];

export default function Accounts() {
  const { user, login } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (!user) { setAccounts([]); return; }
    const q = query(collection(db, 'accounts'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Account[]);
    }, () => addToast('error', 'Could not load accounts.'));
    return () => unsubscribe();
  }, [user, addToast]);

  const openAddForm = (platformId: string) => {
    setAddingFor(platformId);
    setFormName('');
    setFormHandle('');
    setFormUrl('');
  };

  const saveAccount = async () => {
    if (!user || !addingFor || !formName.trim()) return;
    setSaving(true);
    try {
      const platform = platforms.find(p => p.id === addingFor);
      await addDoc(collection(db, 'accounts'), {
        platformId: addingFor,
        name: formName.trim(),
        handle: formHandle.trim(),
        profileUrl: formUrl.trim(),
        status: 'active',
        lastSync: serverTimestamp(),
        ownerId: user.uid,
      });
      addToast('success', `${platform?.name} "${formName}" đã được thêm!`);
      setAddingFor(null);
    } catch (err: any) {
      addToast('error', `Lỗi: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const disconnectAccount = async (id: string, name: string) => {
    if (!user) return;
    setDisconnecting(id);
    try {
      await deleteDoc(doc(db, 'accounts', id));
      addToast('success', `Đã xóa "${name}".`);
    } catch (err: any) {
      addToast('error', `Lỗi: ${err.message}`);
    } finally {
      setDisconnecting(null);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Share2 className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Sign in to manage accounts</h3>
        <p className="text-gray-500 mt-2 mb-6">Connect your social profiles to start sharing content.</p>
        <button onClick={login} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
          <LogIn className="h-4 w-4" /> Sign in with Google
        </button>
      </div>
    );
  }

  const displayedPlatforms = platforms.filter(p => DISPLAYED_PLATFORMS.includes(p.id));

  return (
    <div className="space-y-8">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto',
            t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          )}>
            {t.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {t.message}
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">Social Accounts</h2>
        <p className="mt-1 text-sm text-gray-500">Thêm thông tin tài khoản mạng xã hội của bạn để tạo link chia sẻ nhanh.</p>
      </div>

      {/* Info banner */}
      <div className="rounded-md bg-blue-50 p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Cách hoạt động</p>
          <p className="mt-1">Thêm tên trang/tài khoản và URL profile của bạn. Khi soạn bài ở Composer, app sẽ tạo link chia sẻ trực tiếp đến từng nền tảng — bạn chỉ cần click và đăng.</p>
        </div>
      </div>

      {/* Add account modal */}
      {addingFor && (() => {
        const platform = platforms.find(p => p.id === addingFor)!;
        return (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => setAddingFor(null)}>
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0', platform.color)}>
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={platform.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Thêm tài khoản {platform.name}</h3>
                  <p className="text-xs text-gray-500">Điền thông tin trang/tài khoản của bạn</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                    placeholder={`Ví dụ: Hoàng Thịnh Print - ${platform.name}`}
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username / Handle</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                    placeholder="@username hoặc tên trang"
                    value={formHandle}
                    onChange={e => setFormHandle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Profile / Page</label>
                  <input
                    type="url"
                    className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                    placeholder={`https://${platform.id}.com/yourpage`}
                    value={formUrl}
                    onChange={e => setFormUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setAddingFor(null)} className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ring-1 ring-gray-300">Hủy</button>
                <button
                  onClick={saveAccount}
                  disabled={saving || !formName.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'Đang lưu...' : 'Lưu tài khoản'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Platform grid */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Nền tảng</h3>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {displayedPlatforms.map((platform) => {
            const connected = accounts.filter(a => a.platformId === platform.id);
            return (
              <li key={platform.id} className="divide-y divide-gray-200 rounded-lg bg-white shadow">
                <div className="flex items-center justify-between space-x-4 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{platform.name}</p>
                    <p className="text-xs text-gray-400">{connected.length > 0 ? `${connected.length} tài khoản` : 'Chưa thêm'}</p>
                  </div>
                  <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', platform.color)}>
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={platform.icon} />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => openAddForm(platform.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-b-lg py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <Plus className="h-4 w-4" /> Thêm tài khoản
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Connected list */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Tài khoản đã thêm
          {accounts.length > 0 && <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{accounts.length}</span>}
        </h3>
        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">Chưa có tài khoản nào. Bấm "Thêm tài khoản" ở platform bên trên.</p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {accounts.map(account => {
                const platform = platforms.find(p => p.id === account.platformId);
                return (
                  <li key={account.id} className="flex items-center px-4 py-4 gap-4">
                    <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', platform?.color || 'bg-gray-400')}>
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={platform?.icon || ''} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {account.handle && <span className="mr-2">{account.handle}</span>}
                        {account.profileUrl && (
                          <a href={account.profileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 inline-flex items-center gap-1">
                            Xem profile <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-4 w-4" /> Active
                      </span>
                      <button
                        onClick={() => disconnectAccount(account.id, account.name)}
                        disabled={disconnecting === account.id}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-50"
                      >
                        {disconnecting === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Xóa
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
