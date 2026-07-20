import { useState, useEffect } from 'react';
import { Shield, Users, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'businesses' | 'reservations' | 'payments' | 'system';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

export function AdminPermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load permissions
      const defaultPermissions: Permission[] = [
        { id: 'users.view', name: 'Kullanıcıları Görüntüle', description: 'Kullanıcı listesini görüntüleme', category: 'users' },
        { id: 'users.edit', name: 'Kullanıcıları Düzenle', description: 'Kullanıcı bilgilerini düzenleme', category: 'users' },
        { id: 'users.delete', name: 'Kullanıcıları Sil', description: 'Kullanıcıları silme', category: 'users' },
        { id: 'businesses.view', name: 'İşletmeleri Görüntüle', description: 'İşletme listesini görüntüleme', category: 'businesses' },
        { id: 'businesses.edit', name: 'İşletmeleri Düzenle', description: 'İşletme bilgilerini düzenleme', category: 'businesses' },
        { id: 'businesses.approve', name: 'İşletmeleri Onayla', description: 'İşletme onaylama', category: 'businesses' },
        { id: 'businesses.delete', name: 'İşletmeleri Sil', description: 'İşletmeleri silme', category: 'businesses' },
        { id: 'reservations.view', name: 'Rezervasyonları Görüntüle', description: 'Rezervasyon listesini görüntüleme', category: 'reservations' },
        { id: 'reservations.edit', name: 'Rezervasyonları Düzenle', description: 'Rezervasyon bilgilerini düzenleme', category: 'reservations' },
        { id: 'payments.view', name: 'Ödemeleri Görüntüle', description: 'Ödeme listesini görüntüleme', category: 'payments' },
        { id: 'payments.refund', name: 'İade İşlemleri', description: 'Ödeme iadesi yapma', category: 'payments' },
        { id: 'system.settings', name: 'Sistem Ayarları', description: 'Sistem ayarlarını değiştirme', category: 'system' },
        { id: 'system.logs', name: 'Logları Görüntüle', description: 'Sistem loglarını görüntüleme', category: 'system' },
      ];
      setPermissions(defaultPermissions);

      // Load roles
      const defaultRoles: Role[] = [
        {
          id: 'super_admin',
          name: 'Süper Admin',
          description: 'Tüm yetkilere sahip',
          permissions: defaultPermissions.map(p => p.id),
          userCount: 1,
        },
        {
          id: 'admin',
          name: 'Admin',
          description: 'Temel yönetim yetkileri',
          permissions: ['users.view', 'users.edit', 'businesses.view', 'businesses.edit', 'reservations.view', 'payments.view'],
          userCount: 0,
        },
        {
          id: 'moderator',
          name: 'Moderatör',
          description: 'Sadece görüntüleme yetkileri',
          permissions: ['users.view', 'businesses.view', 'reservations.view', 'payments.view'],
          userCount: 0,
        },
      ];
      setRoles(defaultRoles);

      // ✅ KRİTİK: Admin users Firestore'dan yüklenecek (hardcoded kaldırıldı)
      // Date: 2026-07-20
      // TODO: Firebase Authentication'dan custom claims = admin olan kullanıcıları çek
      const adminUsersSnapshot = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', 'admin')
        )
      );
      
      const loadedAdminUsers: AdminUser[] = adminUsersSnapshot.docs.map(docSnap => {
        const data = docSnap.data() as { email: string; displayName?: string; role: string; createdAt: string; lastLogin?: string };
        return {
          id: docSnap.id,
          email: data.email,
          name: data.displayName || 'Admin User',
          role: 'admin',
          createdAt: data.createdAt,
          lastLogin: data.lastLogin || data.createdAt,
        };
      });
      
      setAdminUsers(loadedAdminUsers);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;

    try {
      await setDoc(doc(db, 'adminRoles', editingRole.id), editingRole);
      loadData();
      setShowRoleModal(false);
      setEditingRole(null);
    } catch (error) {
      console.error('Save role error:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (roleId === 'super_admin') return; // Prevent deleting super admin

    try {
      await deleteDoc(doc(db, 'adminRoles', roleId));
      loadData();
    } catch (error) {
      console.error('Delete role error:', error);
    }
  };

  const togglePermission = (permissionId: string) => {
    if (!editingRole) return;

    const hasPermission = editingRole.permissions.includes(permissionId);
    setEditingRole({
      ...editingRole,
      permissions: hasPermission
        ? editingRole.permissions.filter(p => p !== permissionId)
        : [...editingRole.permissions, permissionId],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Yetkileri</h1>
          <p className="text-white/60 mt-1">Admin yetkilerini ve rollerini yönet</p>
        </div>
        <button
          onClick={() => {
            setEditingRole({
              id: Date.now().toString(),
              name: '',
              description: '',
              permissions: [],
              userCount: 0,
            });
            setShowRoleModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Rol
        </button>
      </div>

      {/* Admin Users */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Admin Kullanıcılar</h2>
        </div>

        <div className="space-y-3">
          {adminUsers.map((user) => (
            <div key={user.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">{user.name}</h3>
                <p className="text-sm text-white/60">{user.email}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span>Rol: {roles.find(r => r.id === user.role)?.name}</span>
                  {user.lastLogin && (
                    <>
                      <span>•</span>
                      <span>Son Giriş: {new Date(user.lastLogin).toLocaleString('tr-TR')}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                {roles.find(r => r.id === user.role)?.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Roller ve Yetkiler</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white mb-1">{role.name}</h3>
                  <p className="text-sm text-white/60">{role.description}</p>
                </div>
                {role.id !== 'super_admin' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingRole(role);
                        setShowRoleModal(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Yetkiler</span>
                  <span className="text-white/80">{role.permissions.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Kullanıcılar</span>
                  <span className="text-white/80">{role.userCount}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((permId) => {
                  const perm = permissions.find(p => p.id === permId);
                  return perm ? (
                    <span key={permId} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                      {perm.name}
                    </span>
                  ) : null;
                })}
                {role.permissions.length > 3 && (
                  <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded">
                    +{role.permissions.length - 3} daha
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Modal */}
      {showRoleModal && editingRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingRole.name ? 'Rolü Düzenle' : 'Yeni Rol Oluştur'}
              </h3>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setEditingRole(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Rol Adı</label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Açıklama</label>
                <textarea
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-4">Yetkiler</label>
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="bg-white/5 rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3 capitalize">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-start gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={editingRole.permissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="mt-1"
                            />
                            <div>
                              <p className="text-sm font-medium text-white/80">{permission.name}</p>
                              <p className="text-xs text-white/40">{permission.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={handleSaveRole}
                  disabled={!editingRole.name}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
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
