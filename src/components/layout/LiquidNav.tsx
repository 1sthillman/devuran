import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { SupportMenu } from '@/components/support/SupportMenu';
import { cn } from '@/lib/utils';
import { Search, CalendarDays, Menu, X, LogOut, LayoutDashboard, Scissors, Users, Settings, Calendar as CalendarIcon, BarChart3, UserCheck, Star, Shield, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Kesfet', path: '/', icon: Search },
  { label: 'Randevularim', path: '/appointments', icon: CalendarDays },
];

const ownerMenuItems = [
  { key: 'overview', label: 'Genel', icon: LayoutDashboard },
  { key: 'appointments', label: 'Randevular', icon: CalendarIcon },
  { key: 'services', label: 'Hizmetler', icon: Scissors },
  { key: 'staff', label: 'Personel', icon: Users },
  { key: 'settings', label: 'Ayarlar', icon: Settings },
];

export function LiquidNav() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { activeTab, setActiveTab } = useDashboardStore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);

  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const isSuperAdmin = user?.email === 'minifinise@gmail.com';
  const isOnDashboard = location.pathname === '/dashboard';

  const allLinks = isOwner
    ? [...navLinks, { label: 'Panel', path: '/dashboard', icon: LayoutDashboard }]
    : navLinks;

  return (
    <div className="sticky top-0 z-30 px-2 sm:px-4 pt-2 sm:pt-4">
      <nav className="liquid-nav-container">
        {/* Brand */}
        <Link to="/" className="font-display font-bold text-lg text-[var(--chrome-white)] tracking-tight">
          RANDEVU
        </Link>

        {/* Desktop Center Links - HIDDEN */}
        <div className="hidden items-center gap-1">
          {allLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
              key={link.path}
              to={link.path}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full font-heading font-medium text-sm transition-colors',
                isActive
                  ? 'text-[var(--chrome-white)] bg-white/5'
                  : 'text-[var(--muted-lead)] hover:text-[var(--silver-frost)]'
              )}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right: User */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:block">
          <ThemeSwitch />
        </div>
        <div className="sm:hidden">
          <ThemeSwitch compact />
        </div>
        
        {isAuthenticated ? (
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              data-profile-button
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--obsidian-rim)]"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--slate-surface)] border border-[var(--obsidian-rim)]">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                    <span className="text-white font-heading font-bold text-sm">
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <span className="hidden sm:block font-heading font-medium text-sm text-[var(--silver-frost)]">
                {user?.displayName}
              </span>
              <svg 
                className={cn(
                  "w-4 h-4 text-[var(--muted-lead)] transition-transform",
                  menuOpen && "rotate-180"
                )}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dashboard Menu Button - Only on dashboard page, mobile only */}
            {isOwner && isOnDashboard && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden obsidian-card p-2.5 rounded-full hover:bg-white/5 transition-all active:scale-95"
              >
                <LayoutDashboard size={20} className="text-[var(--liquid-chrome)]" strokeWidth={2.5} />
              </button>
            )}

            {/* Dropdown - Maximum Opacity */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-14 z-40 w-56 sm:w-64 rounded-3xl p-2 shadow-2xl bg-[var(--slate-surface)] backdrop-blur-3xl border border-white/20 max-h-[80vh] overflow-y-auto">
                  <div className="px-3 py-2 border-b border-white/20 mb-2">
                    <p className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
                      {user?.displayName}
                    </p>
                    <p className="font-body text-xs text-[var(--muted-lead)] truncate">
                      {user?.email}
                    </p>
                  </div>
                  
                  {/* Owner Dashboard Menu - Only on dashboard page */}
                  {isOwner && isOnDashboard && (
                    <>
                      <div className="px-3 py-1 mb-2">
                        <p className="font-heading font-semibold text-xs text-[var(--muted-lead)] uppercase tracking-wider">
                          Panel Menüsü
                        </p>
                      </div>
                      {ownerMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              setActiveTab(item.key);
                              setMenuOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm transition-colors',
                              isActive
                                ? 'text-[var(--chrome-white)] bg-gradient-to-r from-purple-500/20 to-pink-500/20'
                                : 'text-[var(--silver-frost)] hover:bg-white/5'
                            )}
                          >
                            <Icon size={14} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                      <div className="border-t border-white/20 my-2" />
                    </>
                  )}
                  
                  <Link
                    to="/appointments"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--silver-frost)] hover:bg-white/5 transition-colors"
                  >
                    <CalendarDays size={16} />
                    Randevularim
                  </Link>
                  
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setSupportMenuOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--silver-frost)] hover:bg-white/5 transition-colors"
                  >
                    <LifeBuoy size={16} />
                    Yardım Merkezi
                  </button>
                  
                  {isOwner && !isOnDashboard && (
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--silver-frost)] hover:bg-white/5 transition-colors"
                    >
                      <LayoutDashboard size={16} />
                      Isletme Paneli
                    </Link>
                  )}
                  
                  {isSuperAdmin && (
                    <Link
                      to="/super-admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 transition-colors"
                    >
                      <Shield size={16} />
                      Super Admin Panel
                    </Link>
                  )}
                  
                  <div className="border-t border-white/20 my-2" />
                  
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Cikis Yap
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="liquid-glass-pill px-4 py-2 font-heading font-medium text-sm text-[var(--silver-frost)] hover:text-[var(--chrome-white)] transition-colors"
          >
            Giriş
          </Link>
        )}

        {/* Mobile menu button - HIDDEN FOR NOW */}
        {false && (
          <button
            className="md:hidden p-2 text-[var(--silver-frost)]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && !isAuthenticated && (
        <div className="absolute top-16 left-0 right-0 mx-4 md:hidden liquid-glass p-4 flex flex-col gap-1 z-40">
          {allLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-full font-heading font-medium text-sm',
                  isActive
                    ? 'text-[var(--chrome-white)] bg-white/5'
                    : 'text-[var(--muted-lead)]'
                )}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
      </nav>
      
      {/* Support Menu Modal */}
      {isAuthenticated && (
        <SupportMenu
          isOpen={supportMenuOpen}
          onClose={() => setSupportMenuOpen(false)}
          businessId={user?.salonId}
          businessName={user?.displayName || undefined}
          userType={isOwner ? 'owner' : 'customer'}
        />
      )}
    </div>
  );
}

