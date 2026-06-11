'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Send, FileText, Loader2, Copy, CheckCircle2, AlertCircle, LogIn, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/components/firebase-provider';

interface FetchedItem { id: string; title: string; content: string; url: string; source: string; date: string; image?: string; }
interface Toast { id: number; type: 'success' | 'error'; message: string; }

const SHARE_PLATFORMS = [
  {
    id: 'facebook', label: 'Facebook', color: 'bg-[#1877F2]',
    icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    shareUrl: (text: string, url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: 'linkedin', label: 'LinkedIn', color: 'bg-[#0A66C2]',
    icon: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    shareUrl: (_: string, url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'twitter', label: 'X (Twitter)', color: 'bg-black',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    shareUrl: (text: string, url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'reddit', label: 'Reddit', color: 'bg-[#FF4500]',
    icon: 'M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z',
    shareUrl: (text: string, url: string) => `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: 'github', label: 'GitHub', color: 'bg-[#24292F]',
    icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
    shareUrl: (_: string, url: string) => `https://github.com/`,  // GitHub không có share intent, mở trang chủ
    noShare: true,
    copyOnly: true,
  },
  {
    id: 'behance', label: 'Behance', color: 'bg-[#1769FF]',
    icon: 'M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.726zm-8.672-3h5.108c-.069-1.147-.73-2.44-2.537-2.44-1.755 0-2.515 1.288-2.571 2.44zM6.586 11.148c.743-.168 3.309-.76 3.309-3.367 0-3.211-2.567-3.78-5.176-3.78H0V21h5.142c3.035 0 6.169-.91 6.169-4.456 0-2.137-1.32-3.924-4.725-3.396zM3.007 7.02H4.63c1.173 0 2.128.37 2.128 1.73 0 1.302-.828 1.85-2.044 1.85H3.007V7.02zm0 9.944v-3.993h1.854c1.547 0 2.487.547 2.487 2.02 0 1.44-.983 1.973-2.508 1.973H3.007z',
    shareUrl: (_: string, url: string) => `https://www.behance.net/`,
    noShare: true,
    copyOnly: true,
  },
  {
    id: 'dribbble', label: 'Dribbble', color: 'bg-[#EA4C89]',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.523 0 10-4.48 10-10S17.523 2 12 2zm6.605 4.61a8.502 8.502 0 0 1 1.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 0 0-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.814 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0 1 12 3.475zm-3.633.803a53.896 53.896 0 0 1 3.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 0 1 4.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 0 1-2.19-5.705zM12 20.547a8.482 8.482 0 0 1-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 0 1 1.823 6.475 8.4 8.4 0 0 1-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 0 1-3.655 5.715z',
    shareUrl: (_: string, url: string) => `https://dribbble.com/`,
    noShare: true,
    copyOnly: true,
  },
  {
    id: 'flickr', label: 'Flickr', color: 'bg-[#FF0084]',
    icon: 'M5.334 6.666a5.334 5.334 0 1 0 0 10.668 5.334 5.334 0 0 0 0-10.668zm13.332 0a5.334 5.334 0 1 0 0 10.668 5.334 5.334 0 0 0 0-10.668z',
    shareUrl: (_: string, url: string) => `https://www.flickr.com/`,
    noShare: true,
    copyOnly: true,
  },
  {
    id: 'issuu', label: 'Issuu', color: 'bg-[#F36D5A]',
    icon: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4a6 6 0 1 1 0 12A6 6 0 0 1 12 6zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
    shareUrl: (_: string, url: string) => `https://issuu.com/`,
    noShare: true,
    copyOnly: true,
  },
  {
    id: 'wakelet', label: 'Wakelet', color: 'bg-[#003D6B]',
    icon: 'M4 4l4 12 4-8 4 8 4-12',
    shareUrl: (text: string, url: string) => `https://wakelet.com/wake/new?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    id: 'blogger', label: 'Blogger', color: 'bg-[#FF5722]',
    icon: 'M18.5 2H9a7 7 0 0 0-7 7v6a7 7 0 0 0 7 7h9.5A2.5 2.5 0 0 0 21 19.5v-15A2.5 2.5 0 0 0 18.5 2zM8 7h5a1 1 0 0 1 0 2H8a1 1 0 0 1 0-2zm8 10H8a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2zm0-4H8a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2z',
    shareUrl: (text: string, url: string) => `https://www.blogger.com/blog-this.g?u=${encodeURIComponent(url)}&n=${encodeURIComponent(text)}`,
  },
];

export default function Composer() {
  const { user, login, effectiveOwnerId } = useAuth();
  const [items, setItems] = useState<FetchedItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'linkedin', 'twitter']);
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
    } catch (e: any) { addToast('error', e.message); }
    finally { setIsRewriting(false); }
  };

  const togglePlatform = (id: string) =>
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const handleShareNow = () => {
    if (!postText.trim()) { addToast('error', 'Vui lòng nhập nội dung.'); return; }
    if (selectedPlatforms.length === 0) { addToast('error', 'Chọn ít nhất 1 nền tảng.'); return; }

    const results = selectedPlatforms.map(id => ({ id, opened: false }));
    setShareResults(results);
    setShowSharePanel(true);

    // Platform có share URL → tự mở popup
    const shareable = selectedPlatforms.filter(id => {
      const p = SHARE_PLATFORMS.find(pl => pl.id === id);
      return p && !p.copyOnly;
    });
    shareable.forEach((id, i) => {
      const p = SHARE_PLATFORMS.find(pl => pl.id === id)!;
      setTimeout(() => {
        window.open(p.shareUrl(postText, postUrl), `share_${id}`, 'width=620,height=600,left=200,top=100');
        setShareResults(prev => prev.map(r => r.id === id ? { ...r, opened: true } : r));
      }, i * 600);
    });

    // Platform copy-only → thông báo copy
    const copyOnly = selectedPlatforms.filter(id => SHARE_PLATFORMS.find(pl => pl.id === id)?.copyOnly);
    if (copyOnly.length > 0) {
      const names = copyOnly.map(id => SHARE_PLATFORMS.find(pl => pl.id === id)?.label).join(', ');
      addToast('success', `${names}: đã copy URL — dán vào trang đăng bài của bạn`);
      navigator.clipboard.writeText(postUrl || `${postText}\n\n${postUrl}`).catch(() => {});
    }
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(postUrl ? `${postText}\n\n${postUrl}` : postText);
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

      <div className="rounded-md bg-blue-50 p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Cách chia sẻ</p>
          <p className="mt-1">Chọn bài → chỉnh nội dung → chọn platform → <strong>Chia sẻ ngay</strong>. App tự mở popup của từng platform — đăng nhập vào đó rồi đăng. Với GitHub/Behance/Dribbble/Flickr/Issuu: app sẽ copy URL để bạn dán thủ công.</p>
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
                  <button onClick={() => handleContentSelect(item)}
                    className={cn('w-full text-left px-3 py-3 rounded-md transition-colors', selectedItemId === item.id ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50')}>
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
                  const selected = selectedPlatforms.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => togglePlatform(p.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-all',
                        selected ? `${p.color} text-white ring-transparent shadow-sm` : 'bg-white text-gray-600 ring-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <svg className="h-3.5 w-3.5" fill={selected ? 'white' : 'currentColor'} viewBox="0 0 24 24">
                        <path d={p.icon} />
                      </svg>
                      {p.label}
                      {p.copyOnly && <span className={cn('text-xs', selected ? 'text-white/70' : 'text-gray-400')}>(copy)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">URL bài viết</label>
              <input type="url"
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                placeholder="https://example.com/bai-viet"
                value={postUrl} onChange={e => setPostUrl(e.target.value)} />
            </div>

            {/* Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-900">Nội dung bài đăng</label>
                <span className="text-xs text-gray-400">{postText.length} ký tự</span>
              </div>
              <textarea rows={7}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                placeholder="Chọn bài viết từ danh sách bên trái, hoặc nhập thủ công..."
                value={postText} onChange={e => setPostText(e.target.value)} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
              <button onClick={handleAiRewrite} disabled={isRewriting || !postText}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-indigo-300 hover:bg-indigo-50 disabled:opacity-50">
                {isRewriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isRewriting ? 'Đang viết lại...' : 'AI Rewrite'}
              </button>
              <button onClick={copyText} disabled={!postText}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Đã copy!' : 'Copy nội dung'}
              </button>
              <div className="flex-1" />
              <button onClick={handleShareNow} disabled={!postText.trim() || selectedPlatforms.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                <Send className="h-4 w-4" />
                Chia sẻ ngay ({selectedPlatforms.length})
              </button>
            </div>
          </div>

          {/* Share status */}
          {showSharePanel && shareResults.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Đang mở popup chia sẻ...</h3>
                <button onClick={() => setShowSharePanel(false)} className="text-xs text-gray-400 hover:text-gray-600">Đóng</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {shareResults.map(result => {
                  const p = SHARE_PLATFORMS.find(pl => pl.id === result.id);
                  if (!p) return null;
                  return (
                    <button key={result.id}
                      onClick={() => {
                        if (p.copyOnly) {
                          navigator.clipboard.writeText(postUrl);
                          addToast('success', `Đã copy URL — dán vào ${p.label}`);
                        } else {
                          window.open(p.shareUrl(postText, postUrl), `share_${result.id}`, 'width=620,height=600,left=200,top=100');
                          setShareResults(prev => prev.map(r => r.id === result.id ? { ...r, opened: true } : r));
                        }
                      }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-all',
                        result.opened ? 'bg-green-50 text-green-700 ring-green-300'
                          : `${p.color} text-white ring-transparent hover:opacity-90`
                      )}
                    >
                      <svg className="h-4 w-4" fill={result.opened ? 'currentColor' : 'white'} viewBox="0 0 24 24">
                        <path d={p.icon} />
                      </svg>
                      {result.opened ? `${p.label} ✓` : p.copyOnly ? `Copy ${p.label}` : p.label}
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
