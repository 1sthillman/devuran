import type { ReactNode } from 'react';
import { LiquidNav } from './LiquidNav';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <LiquidNav />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
