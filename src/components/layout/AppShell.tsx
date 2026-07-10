import type { ReactNode } from 'react';
import { LiquidNav } from './LiquidNav';
import { Footer } from './Footer';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <LiquidNav />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
