'use client';

import { useState } from 'react';
import { Share2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const historyData = [
  { id: 1, content: '10 Tips for Better React Performance', platform: 'Twitter', date: '2026-03-11T10:00:00Z', status: 'published', engagement: '120 likes, 45 RTs' },
  { id: 2, content: 'Company Q3 Earnings Report', platform: 'LinkedIn', date: '2026-03-10T14:30:00Z', status: 'published', engagement: '340 views, 12 comments' },
  { id: 3, content: 'The Future of AI in Web Development', platform: 'Facebook', date: '2026-03-09T09:15:00Z', status: 'failed', error: 'API Rate Limit Exceeded' },
  { id: 4, content: 'Weekly Newsletter: Top 5 CSS Tricks', platform: 'Twitter', date: '2026-03-12T08:00:00Z', status: 'scheduled' },
  { id: 5, content: 'New Product Launch Teaser', platform: 'Instagram', date: '2026-03-08T16:45:00Z', status: 'published', engagement: '500 likes, 30 comments' },
];

export default function History() {
  const [filter, setFilter] = useState('all');

  const filteredHistory = historyData.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Post History
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View your past and scheduled posts across all connected accounts.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <select
            id="status-filter"
            name="status-filter"
            className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {filteredHistory.map((item) => (
            <li key={item.id}>
              <div className="flex items-center px-4 py-4 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center">
                  <div className="flex-shrink-0">
                    <span
                      className={cn(
                        item.status === 'published' ? 'bg-green-100 text-green-600' :
                        item.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                        'bg-red-100 text-red-600',
                        'inline-flex h-12 w-12 items-center justify-center rounded-full'
                      )}
                    >
                      {item.status === 'published' ? (
                        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                      ) : item.status === 'scheduled' ? (
                        <Clock className="h-6 w-6" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-6 w-6" aria-hidden="true" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                    <div>
                      <p className="truncate text-sm font-medium text-indigo-600">{item.content}</p>
                      <p className="mt-2 flex items-center text-sm text-gray-500">
                        <Share2 className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                        <span className="truncate">{item.platform}</span>
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div>
                        <p className="text-sm text-gray-900">
                          {item.status === 'scheduled' ? 'Scheduled for ' : 'Posted on '}
                          <time dateTime={item.date}>{new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500">
                          {item.status === 'published' && item.engagement && (
                            <span className="truncate text-green-600 font-medium">{item.engagement}</span>
                          )}
                          {item.status === 'failed' && item.error && (
                            <span className="truncate text-red-600 font-medium">{item.error}</span>
                          )}
                          {item.status === 'scheduled' && (
                            <span className="truncate text-blue-600 font-medium">Pending</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {item.status === 'failed' && (
                    <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Retry
                    </button>
                  )}
                  {item.status === 'scheduled' && (
                    <button type="button" className="text-sm font-medium text-red-600 hover:text-red-500">
                      Cancel
                    </button>
                  )}
                  {item.status === 'published' && (
                    <button type="button" className="text-sm font-medium text-gray-600 hover:text-gray-500">
                      View
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
