'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Calendar, Download, Filter, TrendingUp, Users, Share2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const dailyData = [
  { name: '05/09', reach: 4000, engagement: 2400, shares: 400 },
  { name: '05/10', reach: 3000, engagement: 1398, shares: 300 },
  { name: '05/11', reach: 2000, engagement: 9800, shares: 1200 },
  { name: '05/12', reach: 2780, engagement: 3908, shares: 800 },
  { name: '05/13', reach: 1890, engagement: 4800, shares: 600 },
  { name: '05/14', reach: 2390, engagement: 3800, shares: 700 },
  { name: '05/15', reach: 3490, engagement: 4300, shares: 900 },
];

const platformPerformance = [
  { name: 'Facebook', posts: 45, clicks: 1200, color: '#1877F2' },
  { name: 'Twitter', posts: 82, clicks: 2400, color: '#1DA1F2' },
  { name: 'LinkedIn', posts: 23, clicks: 800, color: '#0A66C2' },
  { name: 'Instagram', posts: 38, clicks: 1900, color: '#E4405F' },
];

const topContent = [
  { id: 1, title: 'AI in Social Media Marketing', reach: '12.4k', engagement: '8.2%', sentiment: 'Positive' },
  { id: 2, title: '10 Tips for Viral Content', reach: '9.8k', engagement: '6.5%', sentiment: 'Neutral' },
  { id: 3, title: 'Case Study: SocialSync Growth', reach: '15.1k', engagement: '10.5%', sentiment: 'Positive' },
  { id: 4, title: 'Guide to Automated Posting', reach: '5.2k', engagement: '4.1%', sentiment: 'Positive' },
];

export default function Reports() {
  return (
    <div className="space-y-8 pb-12">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Advanced Analytics
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Deep dive into your content performance and audience engagement.
          </p>
        </div>
        <div className="mt-4 flex space-x-3 sm:ml-16 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <Calendar className="-ml-0.5 h-5 w-5 text-gray-400" />
            Last 7 Days
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Download className="-ml-0.5 h-5 w-5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Reach</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1">198,432</h4>
            </div>
            <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-semibold flex items-center group">
              <TrendingUp className="h-4 w-4 mr-1" />
              12.5%
            </span>
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Engagement</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1">45,671</h4>
            </div>
            <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-semibold flex items-center group">
              <TrendingUp className="h-4 w-4 mr-1" />
              8.3%
            </span>
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Shares</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1">3,490</h4>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Share2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-semibold flex items-center group">
              <TrendingUp className="h-4 w-4 mr-1" />
              24.1%
            </span>
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Reach & Engagement Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Reach & Engagement Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="reach" stroke="#6366F1" fillOpacity={1} fill="url(#colorReach)" strokeWidth={2} />
                <Area type="monotone" dataKey="engagement" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorEngagement)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Platform Clicks Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformPerformance} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 13, fontWeight: 500}} />
                <Tooltip />
                <Bar dataKey="clicks" radius={[0, 4, 4, 0]} barSize={32}>
                  {platformPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 text-vietnamese">Top Performing Content</h3>
          <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Reach</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topContent.map((content) => (
                <tr key={content.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{content.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{content.reach}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: content.engagement }}></div>
                      </div>
                      {content.engagement}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      content.sentiment === 'Positive' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    )}>
                      {content.sentiment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
