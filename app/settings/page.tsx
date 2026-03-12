'use client';

import { useState } from 'react';
import { Save, Bell, Shield, Key } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account preferences and application settings.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-1/4">
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'general' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Shield className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Bell className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'api' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Key className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              API Keys
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Profile Information</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Update your account details and email address.</p>
                </div>
                <form className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Name</label>
                    <div className="mt-2">
                      <input type="text" name="name" id="name" defaultValue="Thanh" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
                    <div className="mt-2">
                      <input type="email" name="email" id="email" defaultValue="thanhnt.ads@gmail.com" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button type="button" className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                      <Save className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Notification Preferences</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Choose what you want to be notified about.</p>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="flex items-start">
                    <div className="flex h-6 items-center">
                      <input id="comments" name="comments" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="comments" className="font-medium text-gray-900">Successful Posts</label>
                      <p className="text-gray-500">Get notified when a post is successfully published.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex h-6 items-center">
                      <input id="candidates" name="candidates" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="candidates" className="font-medium text-gray-900">Failed Posts</label>
                      <p className="text-gray-500">Get notified immediately if a post fails to publish.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex h-6 items-center">
                      <input id="offers" name="offers" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="offers" className="font-medium text-gray-900">New Content Fetched</label>
                      <p className="text-gray-500">Get notified when new content is found from your sources.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">API Keys</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Manage API keys for external integrations.</p>
                </div>
                <div className="mt-5">
                  <div className="rounded-md bg-gray-50 px-6 py-5 sm:flex sm:items-start sm:justify-between">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 sm:ml-4 sm:mt-0">
                        <div className="text-sm font-medium text-gray-900">Gemini API Key</div>
                        <div className="mt-1 text-sm text-gray-600 sm:flex sm:items-center">
                          <div>Used for AI rewriting and content generation.</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:ml-6 sm:mt-0 sm:flex-shrink-0">
                      <button type="button" className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
