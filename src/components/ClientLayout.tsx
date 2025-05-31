'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from 'next-themes';
import { Navbar } from '@/components/Navbar';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange>
      <AuthProvider>
        <Navbar />
        <main className="min-h-screen bg-background transition-colors">
          {children}
        </main>
      </AuthProvider>
    </ThemeProvider>
  );
}
