import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { appointmentAutoCompleteService } from '@/services/appointmentAutoCompleteService';

// Lazy load pages for better performance
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const SalonDetail = lazy(() => import('@/pages/SalonDetail').then(m => ({ default: m.SalonDetail })));
const Booking = lazy(() => import('@/pages/Booking').then(m => ({ default: m.Booking })));
const BookingSuccess = lazy(() => import('@/pages/BookingSuccess').then(m => ({ default: m.BookingSuccess })));
const Appointments = lazy(() => import('@/pages/Appointments').then(m => ({ default: m.Appointments })));
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const OwnerDashboard = lazy(() => import('@/pages/OwnerDashboard').then(m => ({ default: m.OwnerDashboard })));

// Loading component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function AnimatedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.99 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const { theme, actualTheme, setTheme } = useThemeStore();

  // Initialize theme on app mount
  useEffect(() => {
    // Re-apply theme to ensure it's set correctly
    setTheme(theme);
  }, []);

  // Initialize Firebase auth listener on app mount
  useEffect(() => {
    const init = async () => {
      await initAuth();
    };
    init();
  }, [initAuth]);

  // Start appointment auto-complete service
  useEffect(() => {
    appointmentAutoCompleteService.start();
    
    return () => {
      appointmentAutoCompleteService.stop();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                <AnimatedRoute>
                  <Home />
                </AnimatedRoute>
              }
            />
            <Route
              path="/salon/:id"
              element={
                <AnimatedRoute>
                  <SalonDetail />
                </AnimatedRoute>
              }
            />
            <Route
              path="/booking/:salonId"
              element={
                <AnimatedRoute>
                  <Booking />
                </AnimatedRoute>
              }
            />
            <Route
              path="/booking-success/:reservationId"
              element={
                <AnimatedRoute>
                  <BookingSuccess />
                </AnimatedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <AnimatedRoute>
                  <Appointments />
                </AnimatedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <AnimatedRoute>
                  <Login />
                </AnimatedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AnimatedRoute>
                  <OwnerDashboard />
                </AnimatedRoute>
              }
            />
            <Route
              path="/customer-dashboard"
              element={
                <AnimatedRoute>
                  <Dashboard />
                </AnimatedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AppShell>
    </ErrorBoundary>
  );
}
