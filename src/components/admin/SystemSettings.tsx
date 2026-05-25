import { useState, useEffect } from 'react';
import { Settings, Globe, Bell, Shield, Database, Zap, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SystemConfig {
  maintenance: {
    enabled: boolean;
    message: string;
    allowedEmails: string[];
  };
  features: {
    userRegistration: boolean;
    businessRegistration: boolean;
    onlinePayments: boolean;
    notifications: boolean;
    reviews: boolean;
    queue: boolean;
  };
  limits: {
    maxBusinessesPerUser: number;
    maxStaffPerBusiness: number;
    maxServicesPerBusiness: number;
    maxImagesPerBusiness: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  security: {
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    maintenance: {
      enabled: false,
      message: 'Sistem bakımda. Lütfen daha sonra tekrar deneyin.',
      allowedEmails: ['minifinise@gmail.com'],
    },
    features: {
      userRegistration: true,
      businessRegistration: true,
      onlinePayments: true,
      notifications: true,
      reviews: true,
      queue: true,
    },
    limits: {
      maxBusinessesPerUser: 5,
      maxStaffPerBusiness: 50,
      maxServicesPerBusiness: 100,
      maxImagesPerBusiness: 20,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
    },
    security: {
      requireEmailVerification: true,
      requirePhoneVerification: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configDoc = await getDoc(doc(db, 'systemConfig', 'main'));
      if (configDoc.exists()) {
        setConfig(configDoc.data() as SystemConfig);
      }
    } catch (error) {
      console.error('Load config error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await setDoc(doc(db, 'systemConfig', 'main'), {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: 'minifinise@gmail.com',
      });
    } catch (error) {
      console.error('Save config error:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (feature: keyof SystemConfig['features']) => {
    setConfig({
      ...config,
      features: {
        ...config.features,
        [feature]: !config.features[feature],
      },
    });
  };

  const toggleNotification = (type: keyof SystemConfig['notifications']) => {
    setConfig({
      ...config,
      notifications: {
        ...config.notifications,
        [type]: !config.notifications[type],
      },
    });
  };

  const toggleSecurity = (setting: keyof SystemConfig['security']) => {
    if (typeof config.security[setting] === 'boolean') {
      setConfig({
        ...config,
        security: {
          ...config.security,
          [setting]: !config.security[setting],
        },
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sistem Ayarları</h1>
          <p className="text-white/60 mt-1">Sistem genelini yapılandır</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white rounded-xl transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Settings className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Bakım Modu</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 font-medium">Bakım Modu</p>
              <p className="text-sm text-white/60">Sistemi bakım moduna al</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, maintenance: { ...config.maintenance, enabled: !config.maintenance.enabled } })}
              className="relative"
            >
              {config.maintenance.enabled ? (
                <ToggleRight className="w-12 h-12 text-green-400" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-white/40" />
              )}
            </button>
          </div>

          {config.maintenance.enabled && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Bakım Mesajı</label>
              <textarea
                value={config.maintenance.message}
                onChange={(e) => setConfig({ ...config, maintenance: { ...config.maintenance, message: e.target.value } })}
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Özellik Bayrakları</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config.features).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white/80 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              </div>
              <button onClick={() => toggleFeature(key as keyof SystemConfig['features'])}>
                {value ? (
                  <ToggleRight className="w-10 h-10 text-green-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-white/40" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Limits */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Sistem Limitleri</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config.limits).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-white/80 mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setConfig({
                  ...config,
                  limits: { ...config.limits, [key]: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Bildirim Ayarları</h2>
        </div>
        
        <div className="space-y-4">
          {Object.entries(config.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white/80 font-medium capitalize">{key.replace('Enabled', '')}</p>
              </div>
              <button onClick={() => toggleNotification(key as keyof SystemConfig['notifications'])}>
                {value ? (
                  <ToggleRight className="w-10 h-10 text-green-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-white/40" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Güvenlik Ayarları</h2>
        </div>
        
        <div className="space-y-4">
          {Object.entries(config.security).map(([key, value]) => (
            <div key={key} className="p-4 bg-white/5 rounded-xl">
              {typeof value === 'boolean' ? (
                <div className="flex items-center justify-between">
                  <p className="text-white/80 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <button onClick={() => toggleSecurity(key as keyof SystemConfig['security'])}>
                    {value ? (
                      <ToggleRight className="w-10 h-10 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-white/40" />
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setConfig({
                      ...config,
                      security: { ...config.security, [key]: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
