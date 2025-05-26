'use client';

import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="min-h-screen bg-gray-50">{children}</main>
    </AuthProvider>
  );
}
