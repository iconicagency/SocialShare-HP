import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { FirebaseProvider } from '@/components/firebase-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'SocialSync - Connect, Fetch, Share',
  description: 'Connect social accounts, fetch website content, and share it across multiple social entities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full bg-gray-50`}>
      <body className="h-full font-sans antialiased text-gray-900" suppressHydrationWarning>
        <div className="flex h-full">
          {/* Sidebar for desktop */}
          <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
            <Sidebar />
          </div>

          <div className="flex flex-1 flex-col lg:pl-64 h-full overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <FirebaseProvider>
                {children}
              </FirebaseProvider>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
