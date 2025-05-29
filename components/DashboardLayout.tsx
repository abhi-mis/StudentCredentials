import React from 'react';
import Navbar from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <footer className="py-6 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Certificate Verification Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}