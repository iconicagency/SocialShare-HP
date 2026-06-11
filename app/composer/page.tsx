'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Send, Clock, FileText, Loader2, Copy, ExternalLink, CheckCircle2, AlertCircle, LogIn, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { platforms } from '@/lib/platforms';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/firebase-provider';

interface FetchedItem {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  date: string;
  image?: string;
}

interface Account {
  id: string;
  platformId: string;
  name: string;
  handle: string;
  profileUrl: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

function buildShareUrl(platformId: string, text: string, url: string): string {
  const encoded = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const combined = encodeURIComponent(`${text}\n\n${url}`);
  switch (platformId) {
    case 'facebook':  return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`;
    case 'twitter':   return `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`;
    case 'linkedin':  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'reddit':    return `https://reddit.com/submit?url=${encodedUrl}&title=${encoded}`;
    case 'pinterest': return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encoded}`;
    case 'telegram':  return `https://t.me/share/url?url=${encodedUrl}&text=${encoded}`;
    case 'whatsapp':  return `https://wa.me/?text=${combined}`;
    case 'tumblr':    return `https://www.tumblr.com/share/link?url=${encodedUrl}&name=${encoded}`;
    case 'bluesky':   return `https://bsky.app/intent/compose?text=${combined}`;
    default:          return '';
  }
}

const SHARE_PLATFORMS = ['facebook', 'twitter', 'linkedin', 'telegram', 'whatsapp', 'reddit', 'pinterest', 'bluesky'];

export default function Composer() {
  const { user, login } = useAuth();
  const [items, setItems] = useState<FetchedItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'twitter', 'linkedin']);
  const [isRewriting, setIsRewriting] = useState(false);
  const [shareResults, setShareResults] = useState<{ platformId: string; url: string; opened: boolean }[]>([]);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [copied, setCopied] = useState(false);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q1 = query(collection(db, 'items'), where('ownerId', '==', user.uid));
    const u1 = onSnapshot(q1, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })) as FetchedItem[]);
    });
    const q2 = query(collection(db, 'accounts'), where('ownerId', '==', user.uid));
    const u2 = onSnapshot(q2, snap => {
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Account[]);
    });
    return () => { u1(); u2(); };
  }, [user]);

  const sortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleContentSelect = (item: FetchedItem) => {
    setSelectedItemId(item.id);
    setPostUrl(item.url);
    setPostText(`${item.title}\n\n${item.content ? item.content.slice(0, 200) + (item.content.length > 200 ? '...' : '') : ''}`);
    setShareResults([]);
    setShowSharePanel(false);
  };

  const handleAiRewrite = async () => {
    if (!postText) return;
    setIsRewriting(true);
    try {
      const res = await fetch('/api/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: postText, platforms: selectedPlatforms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI rewrite failed');
      setPostText(data.result);
      addToast('success', 'AI đã viết lại nội dung!');
    } catch (e: any) {
      addToast('error', e.message);
    } finally {
      setIsRewriting(false);
    }
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handlePostNow = () => {
    if (!postText.trim()) { addToast('error', 'Vui lòng nhập nội dung bài đăng.'); return; }
    const results = selectedPlatforms.map(platformId => ({
      platformId,
      url: buildShareUrl(platformId, postText, postUrl),
      opened: false,
    }));
    setShareResults(results);
    setShowSharePanel(true);
  };

  const openShareLink = (platformId: string, shareUrl: string) => {
    if (!shareUrl) { addToast('error', 'Nền tảng này chưa hỗ trợ share link trực tiếp.'); return; }
    window.open(shareUrl, '_blank', 'width=600,height=600');
    setShareResults(prev => prev.map(r => r.platformId === platformId ? { ...r, opened: true } : r));
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(`${postText}\n\n${postUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('success', 'Đã copy nội dung!');
  };

  const sharePlatformObjects = platforms.filter(p => SHARE_PLATFORMS.includes(p.id));

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Send className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Sign in to compose posts</h3>
        <p className="text-gray-500 mt-2 mb-6">Connect your account to start sharing content.</p>
        <button onClick={login} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
          <LogIn className="h-4 w-4" /> Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={cn('flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto', t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white')}>
            {t.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {t.message}
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">Post Composer</h2>
        <p className="mt-1 text-sm text-gray-500">Soạn nội dung và chia sẻ lên nhiều mạng xã hội cùng lúc.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Content list */}
        <div className="bg-white shadow sm:rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" /> Nội dung đã fetch ({items.length})
          </h3>
          {sortedItems.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              <p>Chưa có nội dung.</p>
              <p className="mt-1">Vào <strong>Content Sources</strong> để fetch bài viết.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[550px] overflow-y-auto">
              {sortedItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleContentSelect(item)}
                    className={cn(
                      'w-full text-left p-3 rounded-md transition-colors',
                      selectedItemId === item.id ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-400">{item.source} · {new Date(item.date).toLocaleDateString('vi-VN')}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Composer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white shadow sm:rounded-lg p-6 space-y-5">

            {/* Platform selector */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Chọn nền tảng chia sẻ</label>
              <div className="flex flex-wrap gap-2">
                {sharePlatformObjects.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors',
                      selectedPlatforms.includes(platform.id)
                        ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                        : 'bg-white text-gray-600 ring-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <svg className={cn('h-3.5 w-3.5', platform.textColor)} fill="currentColor" viewBox="0 0 24 24">
                      <path d={platform.icon} />
                    </svg>
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>

            {/* URL input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">URL bài viết</label>
              <input
                type="url"
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                placeholder="https://example.com/bai-viet"
                value={postUrl}
                onChange={e => setPostUrl(e.target.value)}
              />
            </div>

            {/* Text area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-900">Nội dung bài đăng</label>
                <span className="text-xs text-gray-400">{postText.length} ký tự</span>
              </div>
              <div className="relative">
                <textarea
                  rows={7}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                  placeholder="Chọn bài viết từ danh sách bên trái hoặc nhập nội dung thủ công..."
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={handleAiRewrite}
                disabled={isRewriting || !postText}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
              >
                {isRewriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isRewriting ? 'Đang viết...' : 'AI Rewrite'}
              </button>

              <button
                onClick={copyText}
                disabled={!postText}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Đã copy!' : 'Copy nội dung'}
              </button>

              <div className="flex-1" />

              <button
                onClick={handlePostNow}
                disabled={!postText.trim() || selectedPlatforms.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Chia sẻ ngay ({selectedPlatforms.length})
              </button>
            </div>
          </div>

          {/* Share panel */}
          {showSharePanel && shareResults.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-500" />
                  Mở link chia sẻ
                </h3>
                <button onClick={() => setShowSharePanel(false)} className="text-xs text-gray-400 hover:text-gray-600">Đóng</button>
              </div>
              <p className="text-xs text-gray-500 mb-4">Click vào từng nền tảng để mở cửa sổ share. Bạn sẽ cần đăng nhập vào tài khoản của mình trên từng platform.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {shareResults.map(result => {
                  const platform = platforms.find(p => p.id === result.platformId);
                  if (!platform) return null;
                  return (
                    <button
                      key={result.platformId}
                      onClick={() => openShareLink(result.platformId, result.url)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-lg p-4 ring-1 transition-all',
                        result.opened
                          ? 'ring-green-300 bg-green-50'
                          : result.url
                          ? 'ring-gray-200 hover:ring-indigo-300 hover:bg-indigo-50'
                          : 'ring-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', platform.color)}>
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={platform.icon} />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{platform.name}</span>
                      {result.opened
                        ? <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Đã mở</span>
                        : result.url
                        ? <span className="text-xs text-indigo-500 flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Click để share</span>
                        : <span className="text-xs text-gray-400">Chưa hỗ trợ</span>
                      }
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
