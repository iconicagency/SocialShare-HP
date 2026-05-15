'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Calendar, Image as ImageIcon, Link as LinkIcon, Send, Clock, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { platforms } from '@/lib/platforms';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface FetchedItem {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  date: string;
  image?: string;
}

export default function Composer() {
  const [items, setItems] = useState<FetchedItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter', 'linkedin']);
  const [isRewriting, setIsRewriting] = useState(false);

  // Load fetched items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('socialsync_fetched_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed);
      } catch (e) {
        console.error('Failed to parse saved items', e);
      }
    }
  }, []);

  const handleContentSelect = (id: string) => {
    setSelectedContentId(id);
    const content = items.find(c => c.id === id);
    if (content) {
      setPostText(`Check out this new article from ${content.source}: ${content.title}\n\nRead more here: ${content.url}`);
    }
  };

  const handleAiRewrite = async () => {
    if (!postText || !process.env.NEXT_PUBLIC_GEMINI_API_KEY) return;

    setIsRewriting(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const platformNames = selectedPlatforms.map(id => platforms.find(p => p.id === id)?.name).join(', ');
      
      const prompt = `
        You are a social media expert. Rewrite the following content to be engaging and optimized for ${platformNames}.
        
        Keep it concise, use a few relevant emojis, and maintain a professional but friendly tone. 
        Include relevant hashtags if appropriate.
        
        Original Content:
        "${postText}"
        
        Rewritten Post:
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) {
        setPostText(text.trim());
      }
    } catch (error) {
      console.error('AI Rewrite error:', error);
      alert('Failed to rewrite content. Please check your Gemini API key in settings.');
    } finally {
      setIsRewriting(false);
    }
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Post Composer
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Create, edit, and schedule posts across your social accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Content Selection */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-gray-400" />
              Available Content
            </h3>
            <ul role="list" className="divide-y divide-gray-200 h-[500px] overflow-y-auto">
              {items.length === 0 ? (
                <li className="py-10 text-center text-gray-500 text-sm">
                  No content found. Please add a source in the "Content Sources" page.
                </li>
              ) : (
                items.map((item) => (
                  <li key={item.id} className="py-4">
                    <button
                      onClick={() => handleContentSelect(item.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-md transition-colors",
                        selectedContentId === item.id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>{item.source}</span>
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Composer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow sm:rounded-lg p-6">
            {/* Platform Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                Select Targets
              </label>
              <div className="flex flex-wrap gap-3">
                {platforms.slice(0, 10).map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      "inline-flex items-center gap-x-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset",
                      selectedPlatforms.includes(platform.id)
                        ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                        : "bg-white text-gray-700 ring-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <svg className={cn("h-4 w-4", platform.textColor)} fill="currentColor" viewBox="0 0 24 24">
                      <path d={platform.icon} />
                    </svg>
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Area */}
            <div>
              <label htmlFor="post-text" className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                Post Content
              </label>
              <div className="relative">
                <textarea
                  id="post-text"
                  name="post-text"
                  rows={8}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Paste a link or select content from the left to start..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAiRewrite}
                    disabled={isRewriting || !postText}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    title="Rewrite with AI"
                  >
                    {isRewriting ? (
                      <Loader2 className="-ml-0.5 h-4 w-4 animate-spin text-indigo-600" />
                    ) : (
                      <Sparkles className="-ml-0.5 h-4 w-4 text-indigo-600" />
                    )}
                    {isRewriting ? 'Rewriting...' : 'AI Rewrite'}
                  </button>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="mt-4 flex items-center space-x-4 border-t border-gray-200 pt-4">
              <button type="button" className="text-gray-400 hover:text-gray-500 flex items-center text-sm">
                <ImageIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Add Media
              </button>
              <button type="button" className="text-gray-400 hover:text-gray-500 flex items-center text-sm">
                <LinkIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Add Link
              </button>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-x-4 border-t border-gray-200 pt-6">
              <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
                Save Draft
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Clock className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                Schedule
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <Send className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Post Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

