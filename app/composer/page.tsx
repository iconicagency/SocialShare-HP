'use client';

import { useState } from 'react';
import { Sparkles, Calendar, Image as ImageIcon, Link as LinkIcon, Send, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { platforms } from '@/lib/platforms';

const fetchedContent = [
  { id: 1, title: '10 Tips for Better React Performance', source: 'Tech Blog RSS', date: '2 hours ago', url: 'https://techblog.com/react-tips' },
  { id: 2, title: 'Company Q3 Earnings Report', source: 'Company News', date: '5 hours ago', url: 'https://mycompany.com/q3' },
  { id: 3, title: 'The Future of AI in Web Development', source: 'Industry Updates', date: '1 day ago', url: 'https://industry.com/ai-web' },
];

export default function Composer() {
  const [selectedContent, setSelectedContent] = useState<number | null>(null);
  const [postText, setPostText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter', 'linkedin']);

  const handleContentSelect = (id: number) => {
    setSelectedContent(id);
    const content = fetchedContent.find(c => c.id === id);
    if (content) {
      setPostText(`Check out this new article: ${content.title}\n\nRead more here: ${content.url}`);
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
              Recent Fetched Content
            </h3>
            <ul role="list" className="divide-y divide-gray-200">
              {fetchedContent.map((item) => (
                <li key={item.id} className="py-4">
                  <button
                    onClick={() => handleContentSelect(item.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-md transition-colors",
                      selectedContent === item.id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{item.source}</span>
                      <span>{item.date}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <button className="mt-4 w-full text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all content sources &rarr;
            </button>
          </div>
        </div>

        {/* Right Column: Composer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow sm:rounded-lg p-6">
            {/* Platform Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                Select Platforms
              </label>
              <div className="flex flex-wrap gap-3">
                {platforms.map((platform) => (
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
                  rows={6}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="What do you want to share?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    title="Rewrite with AI"
                  >
                    <Sparkles className="-ml-0.5 h-4 w-4 text-indigo-600" aria-hidden="true" />
                    AI Rewrite
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
