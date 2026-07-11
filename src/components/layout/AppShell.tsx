import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LiquidNav } from './LiquidNav';
import { Footer } from './Footer';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  
  // Footer sadece ana sayfada gösterilsin
  const showFooter = location.pathname === '/';
  
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <LiquidNav />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      <ToastContainer />
    </div>
  );
}
