'use client';

import { useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, Share2, Globe, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  { name: 'Total Posts Shared', value: '1,245', change: '+12%', changeType: 'positive', icon: Share2 },
  { name: 'Connected Accounts', value: '8', change: '+2', changeType: 'positive', icon: Users },
  { name: 'Active Sources', value: '3', change: '0', changeType: 'neutral', icon: Globe },
  { name: 'Engagement Rate', value: '4.6%', change: '-0.5%', changeType: 'negative', icon: Activity },
];

const data = [
  { name: 'Mon', posts: 12, engagement: 400 },
  { name: 'Tue', posts: 19, engagement: 300 },
  { name: 'Wed', posts: 15, engagement: 500 },
  { name: 'Thu', posts: 22, engagement: 280 },
  { name: 'Fri', posts: 30, engagement: 590 },
  { name: 'Sat', posts: 10, engagement: 200 },
  { name: 'Sun', posts: 8, engagement: 150 },
];

const recentActivity = [
  { id: 1, type: 'post', content: 'New blog post: 10 Tips for React', platform: 'Twitter', time: '2 hours ago', status: 'Success' },
  { id: 2, type: 'fetch', content: 'Fetched 3 new articles from mywebsite.com', platform: 'System', time: '4 hours ago', status: 'Success' },
  { id: 3, type: 'post', content: 'Weekly newsletter update', platform: 'LinkedIn', time: '5 hours ago', status: 'Failed' },
  { id: 4, type: 'connect', content: 'Connected new Facebook Page', platform: 'Facebook', time: '1 day ago', status: 'Success' },
];

export default function Dashboard() {
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('ResizeObserver loop completed with undelivered notifications.')
      ) {
        return;
      }
      originalError.call(console, ...args);
    };

    const handleResizeObserverError = (e: ErrorEvent) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        const resizeObserverErrDiv = document.getElementById(
          'webpack-dev-server-client-overlay-div'
        );
        const resizeObserverErr = document.getElementById(
          'webpack-dev-server-client-overlay'
        );
        if (resizeObserverErr) {
          resizeObserverErr.setAttribute('style', 'display: none');
        }
        if (resizeObserverErrDiv) {
          resizeObserverErrDiv.setAttribute('style', 'display: none');
        }
      }
    };

    window.addEventListener('error', handleResizeObserverError);

    return () => {
      console.error = originalError;
      window.removeEventListener('error', handleResizeObserverError);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard Overview
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Monitor your content sharing performance across all connected social entities.
        </p>
      </div>

      {/* Stats */}
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-xl bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p
                className={cn(
                  item.changeType === 'positive' ? 'text-green-600' : item.changeType === 'negative' ? 'text-red-600' : 'text-gray-500',
                  'ml-2 flex items-baseline text-sm font-semibold'
                )}
              >
                {item.changeType === 'positive' ? (
                  <ArrowUpRight className="h-4 w-4 shrink-0 self-center text-green-500" aria-hidden="true" />
                ) : item.changeType === 'negative' ? (
                  <ArrowDownRight className="h-4 w-4 shrink-0 self-center text-red-500" aria-hidden="true" />
                ) : null}
                <span className="sr-only"> {item.changeType === 'positive' ? 'Increased' : 'Decreased'} by </span>
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Sharing Activity (Last 7 Days)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="posts" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {recentActivity.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== recentActivity.length - 1 ? (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={cn(
                            activity.status === 'Success' ? 'bg-green-500' : activity.status === 'Failed' ? 'bg-red-500' : 'bg-gray-400',
                            'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white'
                          )}
                        >
                          {activity.type === 'post' ? (
                            <Share2 className="h-4 w-4 text-white" aria-hidden="true" />
                          ) : activity.type === 'fetch' ? (
                            <Globe className="h-4 w-4 text-white" aria-hidden="true" />
                          ) : (
                            <Users className="h-4 w-4 text-white" aria-hidden="true" />
                          )}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.content}{' '}
                            <span className="font-medium text-gray-900">({activity.platform})</span>
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <time dateTime={activity.time}>{activity.time}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
