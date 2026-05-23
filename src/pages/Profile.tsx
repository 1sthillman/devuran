import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { LogOut, User, Mail, Phone, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile Header */}
        <div className="obsidian-card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--slate-surface)] border-2 border-[var(--obsidian-rim)]">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="text-white font-heading font-bold text-2xl">
                    {user.displayName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-1">
                {user.displayName}
              </h1>
              <p className="font-body text-sm text-[var(--muted-lead)]">
                {user.role === 'owner' ? 'İşletme Sahibi' : 'Müşteri'}
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <Mail size={18} className="text-[var(--muted-lead)]" />
              <span className="font-body text-sm text-[var(--silver-frost)]">{user.email}</span>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <User size={18} className="text-[var(--muted-lead)]" />
              <span className="font-body text-sm text-[var(--silver-frost)]">
                {user.role === 'owner' ? 'İşletme Sahibi' : 'Müşteri'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 text-red-400 font-heading font-semibold hover:from-red-500/20 hover:to-red-600/20 transition-all active:scale-98"
          >
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </motion.div>
    </div>
  );
}
