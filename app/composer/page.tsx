'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Send, FileText, Loader2, Copy, ExternalLink, CheckCircle2, AlertCircle, LogIn, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { platforms } from '@/lib/platforms';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/components/firebase-provider';

interface FetchedItem { id: string; title: string; content: string; url: string; source: string; date: string; image?: string; }
interface Toast { id: number; type: 'success' | 'error'; message: string; }

const SHARE_PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  color: 'bg-blue-600',   shareUrl: (text: string, url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}` },
  { id: 'twitter',   label: 'Twitter/X', color: 'bg-sky-500',    shareUrl: (text: string, url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  { id: 'linkedin',  label: 'LinkedIn',  color: 'bg-blue-700',   shareUrl: (_: string, url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { id: 'telegram',  label: 'Telegram',  color: 'bg-blue-500',   shareUrl: (text: string, url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { id: 'whatsapp',  label: 'WhatsApp',  color: 'bg-green-500',  shareUrl: (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}` },
  { id: 'reddit',    label: 'Reddit',    color: 'bg-orange-500', shareUrl: (text: string, url: string) => `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}` },
  { id: 'pinterest', label: 'Pinterest', color: 'bg-red-600',    shareUrl: (text: string, url: string) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}` },
  { id: 'bluesky',   label: 'Bluesky',   color: 'bg-blue-400',   shareUrl: (text: string, url: string) => `https://bsky.app/intent/compose?text=${encodeURIComponent(text + '\n\n' + url)}` },
];

export default function Composer() {
  const { user, login, effectiveOwnerId } = useAuth();
  const [items, setItems] = useState<FetchedItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'twitter', 'linkedin']);
  const [isRewriting, setIsRewriting] = useState(false);
  const [shareResults, setShareResults] = useState<{ id: string; opened: boolean }[]>([]);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [copied, setCopied] = useState(false);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (!effectiveOwnerId) return;
    const q = query(collection(db, 'items'), where('ownerId', '==', effectiveOwnerId));
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })) as FetchedItem[]));
  }, [effectiveOwnerId]);

  const sortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleContentSelect = (item: FetchedItem) => {
    setSelectedItemId(item.id);
    setPostUrl(item.url);
    setPostText(`${item.title}\n\n${item.content ? item.content.slice(0, 200) + (item.content.length > 200 ? '...' : '') : ''}`);
    setShareResults([]); setShowSharePanel(false);
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

  const togglePlatform = (id: string) =>
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const handleShareNow = () => {
    if (!postText.trim()) { addToast('error', 'Vui lòng nhập nội dung.'); return; }
    if (selectedPlatforms.length === 0) { addToast('error', 'Chọn ít nhất 1 nền tảng.'); return; }
    setShareResults(selectedPlatforms.map(id => ({ id, opened: false })));
    setShowSharePanel(true);
    // Auto-open all selected platforms
    selectedPlatforms.forEach((id, i) => {
      const p = SHARE_PLATFORMS.find(p => p.id === id);
      if (!p) return;
      const shareUrl = p.shareUrl(postText, postUrl);
      setTimeout(() => {
        window.open(shareUrl, `share_${id}`, 'width=620,height=600,left=200,top=100');
        setShareResults(prev => prev.map(r => r.id === id ? { ...r, opened: true } : r));
      }, i * 600); // 600ms delay giữa các popup
    });
  };

  const copyText = async () => {
    const content = postUrl ? `${postText}\n\n${postUrl}` : postText;
    await navigator.clipboard.writeText(content);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    addToast('success', 'Đã copy nội dung!');
  };

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

      {/* How it works */}
      <div className="rounded-md bg-blue-50 p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Cách chia sẻ</p>
          <p className="mt-1">Chọn bài viết → chỉnh sửa nội dung → chọn nền tảng → bấm <strong>Chia sẻ ngay</strong>. App sẽ mở popup của từng platform — đăng nhập tài khoản của bạn vào đó rồi bấm đăng là xong.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: content list */}
        <div className="bg-white shadow sm:rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            Bài viết đã fetch
            <span className="ml-auto text-xs font-normal text-gray-400">{items.length} bài</span>
          </h3>
          {sortedItems.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm space-y-1">
              <p>Chưa có bài viết nào.</p>
              <p>Vào <strong className="text-gray-600">Content Sources</strong> để fetch.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[580px] overflow-y-auto -mx-1">
              {sortedItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleContentSelect(item)}
                    className={cn('w-full text-left px-3 py-3 rounded-md transition-colors', selectedItemId === item.id ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50')}
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-400">{item.source} · {new Date(item.date).toLocaleDateString('vi-VN')}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: composer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white shadow sm:rounded-lg p-6 space-y-5">

            {/* Platform selector */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Chọn nền tảng chia sẻ
                <span className="ml-2 text-xs font-normal text-gray-400">({selectedPlatforms.length} đã chọn)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SHARE_PLATFORMS.map(p => {
                  const platform = platforms.find(pl => pl.id === p.id);
                  const selected = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-all',
                        selected ? `${p.color} text-white ring-transparent` : 'bg-white text-gray-600 ring-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {platform && (
                        <svg className="h-3.5 w-3.5" fill={selected ? 'white' : 'currentColor'} viewBox="0 0 24 24">
                          <path d={platform.icon} />
                        </svg>
                      )}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">URL bài viết</label>
              <input
                type="url"
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                placeholder="https://example.com/bai-viet (tự điền khi chọn bài từ trái)"
                value={postUrl}
                onChange={e => setPostUrl(e.target.value)}
              />
            </div>

            {/* Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-900">Nội dung bài đăng</label>
                <span className="text-xs text-gray-400">{postText.length} ký tự</span>
              </div>
              <textarea
                rows={7}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                placeholder="Chọn bài viết từ danh sách bên trái, hoặc nhập thủ công..."
                value={postText}
                onChange={e => setPostText(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={handleAiRewrite}
                disabled={isRewriting || !postText}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-indigo-300 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRewriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isRewriting ? 'Đang viết lại...' : 'AI Rewrite'}
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
                onClick={handleShareNow}
                disabled={!postText.trim() || selectedPlatforms.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                Chia sẻ ngay ({selectedPlatforms.length})
              </button>
            </div>
          </div>

          {/* Share status panel */}
          {showSharePanel && shareResults.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-500" />
                  Đang mở popup chia sẻ...
                </h3>
                <button onClick={() => setShowSharePanel(false)} className="text-xs text-gray-400 hover:text-gray-600">Đóng</button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Popup sẽ lần lượt mở cho từng platform. Đăng nhập vào tài khoản của bạn trên mỗi cửa sổ đó và bấm đăng.
              </p>
              <div className="flex flex-wrap gap-3">
                {shareResults.map(result => {
                  const p = SHARE_PLATFORMS.find(pl => pl.id === result.id);
                  if (!p) return null;
                  const platform = platforms.find(pl => pl.id === result.id);
                  return (
                    <button
                      key={result.id}
                      onClick={() => {
                        const url = p.shareUrl(postText, postUrl);
                        window.open(url, `share_${result.id}`, 'width=620,height=600,left=200,top=100');
                        setShareResults(prev => prev.map(r => r.id === result.id ? { ...r, opened: true } : r));
                      }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-all',
                        result.opened
                          ? 'bg-green-50 text-green-700 ring-green-300'
                          : `${p.color} text-white ring-transparent hover:opacity-90`
                      )}
                    >
                      {platform && (
                        <svg className="h-4 w-4" fill={result.opened ? 'currentColor' : 'white'} viewBox="0 0 24 24">
                          <path d={platform.icon} />
                        </svg>
                      )}
                      {result.opened ? <><CheckCircle2 className="h-4 w-4" /> {p.label} ✓</> : p.label}
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
