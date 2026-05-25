// @ts-nocheck
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MoreVertical,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Shield,
  Clock,
  Mail,
  Phone,
  Calendar,
  Package,
  Star,
  RotateCcw,
  Key,
  Smartphone,
  UserCog,
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types';
import { BulkActionsBar } from './BulkActionsBar';
import { adminUserService, auditLogService } from '@/services/adminService';

interface UserWithDetails extends User {
  createdAt?: string;
  lastLogin?: string;
  subscriptionStatus?: string;
  totalReservations?: number;
  totalSpent?: number;
  isBanned?: boolean;
}

export function UserManagement() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'customer' | 'owner' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned' | 'deleted'>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, filterStatus, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
      })) as UserWithDetails[];
      
      setUsers(usersData);
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Status filter
    if (filterStatus === 'banned') {
      filtered = filtered.filter(user => user.isBanned);
    } else if (filterStatus === 'active') {
      filtered = filtered.filter(user => !user.isBanned && !user.isDeleted);
    } else if (filterStatus === 'deleted') {
      filtered = filtered.filter(user => user.isDeleted);
    }

    // Show/hide deleted users
    if (!showDeletedUsers) {
      filtered = filtered.filter(user => !user.isDeleted);
    }

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.uid)));
    }
  };

  const handleBulkBan = async () => {
    const reason = prompt('Ban nedeni:');
    if (!reason) return;

    try {
      await adminUserService.bulkBan(
        Array.from(selectedUsers),
        reason,
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadUsers();
      setSelectedUsers(new Set());
      alert(`${selectedUsers.size} kullanıcı banlandı!`);
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedUsers.size} kullanıcıyı silmek istediğinizden emin misiniz?`)) return;

    try {
      await adminUserService.bulkDelete(
        Array.from(selectedUsers),
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadUsers();
      setSelectedUsers(new Set());
      alert(`${selectedUsers.size} kullanıcı silindi!`);
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleBulkGrantPremium = async () => {
    const days = prompt('Kaç gün premium verilsin?', '30');
    if (!days) return;

    try {
      await adminUserService.bulkGrantPremium(
        Array.from(selectedUsers),
        parseInt(days),
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadUsers();
      setSelectedUsers(new Set());
      alert(`${selectedUsers.size} kullanıcıya ${days} gün premium verildi!`);
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleBulkNotify = () => {
    alert('Toplu bildirim özelliği yakında eklenecek!');
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      await adminUserService.restore(
        userId,
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadUsers();
      alert('Kullanıcı geri yüklendi!');
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleHardDelete = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı KALICI olarak silmek istediğinizden emin misiniz? Bu işlem GERİ ALINAMAZ!')) return;
    
    const confirmation = prompt('Onaylamak için "KALICI SİL" yazın:');
    if (confirmation !== 'KALICI SİL') return;

    try {
      await adminUserService.hardDelete(
        userId,
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadUsers();
      alert('Kullanıcı kalıcı olarak silindi!');
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Bu kullanıcının şifresini sıfırlamak istediğinizden emin misiniz?')) return;

    try {
      const result = await adminUserService.resetPassword(
        userId,
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      alert(`Şifre sıfırlama linki oluşturuldu!\nToken: ${result.resetToken}`);
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleClearDevices = async (userId: string) => {
    if (!confirm('Bu kullanıcının tüm cihazlarını temizlemek istediğinizden emin misiniz?')) return;

    try {
      await adminUserService.clearDevices(
        userId,
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      alert('Cihazlar temizlendi!');
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Kullanıcı rolünü "${newRole}" olarak değiştirmek istediğinizden emin misiniz?`)) return;

    try {
      await adminUserService.changeRole(
        userId,
        newRole,
        user?.uid || 'admin',
        user?.displayName || 'Admin'
      );
      await loadUsers();
      alert('Rol değiştirildi!');
    } catch (error) {
      alert('Hata: ' + error);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı banlamak istediğinizden emin misiniz?')) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBanned: true,
        bannedAt: new Date().toISOString(),
      });
      await loadUsers();
    } catch (error) {
      console.error('Ban user error:', error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBanned: false,
        bannedAt: null,
      });
      await loadUsers();
    } catch (error) {
      console.error('Unban user error:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      await loadUsers();
      alert('Kullanıcı başarıyla silindi!');
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        displayName: editingUser.displayName,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        updatedAt: new Date().toISOString(),
      });
      await loadUsers();
      setShowEditModal(false);
      setEditingUser(null);
      alert('Kullanıcı başarıyla güncellendi!');
    } catch (error) {
      console.error('Update user error:', error);
      alert('Hata: ' + error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Kullanıcı Yönetimi</h1>
        <p className="text-white/60 mt-1">Tüm kullanıcıları görüntüle ve yönet</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="İsim, email veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Roller</option>
            <option value="customer">Müşteri</option>
            <option value="owner">İşletme Sahibi</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="banned">Banlı</option>
            <option value="deleted">Silinmiş</option>
          </select>

          {/* Select All */}
          <button
            onClick={handleSelectAll}
            className="px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl text-sm font-medium transition-colors"
          >
            {selectedUsers.size === filteredUsers.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <p className="text-white/60 text-sm">
              {filteredUsers.length} kullanıcı bulundu
            </p>
            {selectedUsers.size > 0 && (
              <p className="text-purple-400 text-sm font-medium">
                {selectedUsers.size} seçili
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDeletedUsers}
                onChange={(e) => setShowDeletedUsers(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-white/60 text-sm">Silinmişleri Göster</span>
            </label>
            <button 
              onClick={() => {
                const csv = [
                  ['ID', 'Ad', 'Email', 'Telefon', 'Rol', 'Durum', 'Kayıt Tarihi'].join(','),
                  ...filteredUsers.map(u => [
                    u.uid,
                    u.displayName,
                    u.email,
                    u.phone,
                    u.role,
                    u.isBanned ? 'Banlı' : u.isDeleted ? 'Silinmiş' : 'Aktif',
                    u.createdAt || ''
                  ].join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `kullanicilar-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              CSV İndir
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.uid)}
                      onChange={() => handleSelectUser(user.uid)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {user.displayName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{user.displayName}</div>
                        <div className="text-sm text-white/40">{user.uid.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white/80">{user.email}</div>
                    <div className="text-sm text-white/40">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.uid, e.target.value)}
                      className={`
                        px-3 py-1 text-xs leading-5 font-semibold rounded-full bg-transparent border
                        ${user.role === 'admin' ? 'border-red-500/50 text-red-300' : ''}
                        ${user.role === 'owner' ? 'border-purple-500/50 text-purple-300' : ''}
                        ${user.role === 'customer' ? 'border-blue-500/50 text-blue-300' : ''}
                      `}
                    >
                      <option value="customer">Müşteri</option>
                      <option value="owner">İşletme</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isDeleted ? (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-500/20 text-gray-300">
                        Silinmiş
                      </span>
                    ) : user.isBanned ? (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/20 text-red-300">
                        Banlı
                      </span>
                    ) : (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-300">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                    {user.createdAt || 'Bilinmiyor'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {user.isDeleted ? (
                        <>
                          <button
                            onClick={() => handleRestoreUser(user.uid)}
                            className="p-2 hover:bg-white/10 rounded-lg text-green-400 hover:text-green-300 transition-colors"
                            title="Geri Yükle"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleHardDelete(user.uid)}
                            className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                            title="Kalıcı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleResetPassword(user.uid)}
                            className="p-2 hover:bg-white/10 rounded-lg text-yellow-400 hover:text-yellow-300 transition-colors"
                            title="Şifre Sıfırla"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleClearDevices(user.uid)}
                            className="p-2 hover:bg-white/10 rounded-lg text-orange-400 hover:text-orange-300 transition-colors"
                            title="Cihazları Temizle"
                          >
                            <Smartphone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditModal(true);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                            title="Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(user.uid)}
                              className="p-2 hover:bg-white/10 rounded-lg text-green-400 hover:text-green-300 transition-colors"
                              title="Ban Kaldır"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(user.uid)}
                              className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                              title="Banla"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedUsers.size}
        onBulkBan={handleBulkBan}
        onBulkDelete={handleBulkDelete}
        onBulkGrantPremium={handleBulkGrantPremium}
        onBulkNotify={handleBulkNotify}
        onClearSelection={() => setSelectedUsers(new Set())}
      />

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Kullanıcı Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  value={editingUser.displayName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Rol</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="customer">Müşteri</option>
                  <option value="owner">İşletme Sahibi</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveUser}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
