import { useState } from 'react';
import { Bell, Send, Users, Building2, User, Target, Mail, MessageSquare, X } from 'lucide-react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type NotificationType = 'all' | 'users' | 'businesses' | 'specific';
type NotificationChannel = 'push' | 'email' | 'sms' | 'in-app';

export function NotificationCenter() {
  const [notificationType, setNotificationType] = useState<NotificationType>('all');
  const [channels, setChannels] = useState<NotificationChannel[]>(['in-app']);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetIds, setTargetIds] = useState('');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSendNotification = async () => {
    if (!title || !message) {
      alert('Lütfen başlık ve mesaj girin!');
      return;
    }

    if (!confirm('Bildirimi göndermek istediğinizden emin misiniz?')) return;

    try {
      setSending(true);

      // Hedef kullanıcıları belirle
      let targetUserIds: string[] = [];

      if (notificationType === 'all') {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        targetUserIds = usersSnapshot.docs.map(doc => doc.id);
      } else if (notificationType === 'users') {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        targetUserIds = usersSnapshot.docs
          .filter(doc => doc.data().role === 'customer')
          .map(doc => doc.id);
      } else if (notificationType === 'businesses') {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        targetUserIds = usersSnapshot.docs
          .filter(doc => doc.data().role === 'owner')
          .map(doc => doc.id);
      } else if (notificationType === 'specific') {
        targetUserIds = targetIds.split(',').map(id => id.trim()).filter(id => id);
      }

      // Her kullanıcı için bildirim oluştur
      const notificationPromises = targetUserIds.map(userId =>
        addDoc(collection(db, 'notifications'), {
          userId,
          title,
          message,
          type: 'admin_announcement',
          channels,
          read: false,
          createdAt: new Date().toISOString(),
          sentBy: 'admin',
        })
      );

      await Promise.all(notificationPromises);

      alert(`${targetUserIds.length} kullanıcıya bildirim gönderildi!`);
      
      // Formu temizle
      setTitle('');
      setMessage('');
      setTargetIds('');
      setChannels(['in-app']);
    } catch (error) {
      console.error('Send notification error:', error);
      alert('Hata: ' + error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Bildirim Merkezi</h1>
        <p className="text-white/60 mt-1">Toplu bildirim gönder ve yönet</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-sm">Toplam Gönderim</span>
          </div>
          <p className="text-2xl font-bold text-white">0</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Aktif Kullanıcı</span>
          </div>
          <p className="text-2xl font-bold text-white">0</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Mail className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/60 text-sm">Email Gönderim</span>
          </div>
          <p className="text-2xl font-bold text-white">0</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-white/60 text-sm">SMS Gönderim</span>
          </div>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
      </div>

      {/* Notification Form */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Yeni Bildirim Gönder</h2>

        <div className="space-y-6">
          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">Hedef Kitle</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setNotificationType('all')}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${notificationType === 'all'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }
                `}
              >
                <Users className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-sm text-white font-medium">Tüm Kullanıcılar</p>
              </button>

              <button
                onClick={() => setNotificationType('users')}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${notificationType === 'users'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }
                `}
              >
                <User className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-sm text-white font-medium">Müşteriler</p>
              </button>

              <button
                onClick={() => setNotificationType('businesses')}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${notificationType === 'businesses'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }
                `}
              >
                <Building2 className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-sm text-white font-medium">İşletmeler</p>
              </button>

              <button
                onClick={() => setNotificationType('specific')}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${notificationType === 'specific'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }
                `}
              >
                <Target className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-sm text-white font-medium">Özel Seçim</p>
              </button>
            </div>
          </div>

          {/* Specific Target IDs */}
          {notificationType === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Kullanıcı ID'leri (virgülle ayırın)
              </label>
              <input
                type="text"
                value={targetIds}
                onChange={(e) => setTargetIds(e.target.value)}
                placeholder="user1, user2, user3"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">Gönderim Kanalları</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['in-app', 'push', 'email', 'sms'] as NotificationChannel[]).map((channel) => (
                <label
                  key={channel}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${channels.includes(channel)
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setChannels([...channels, channel]);
                      } else {
                        setChannels(channels.filter(c => c !== channel));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-white font-medium capitalize">
                    {channel === 'in-app' ? 'Uygulama İçi' : channel === 'push' ? 'Push' : channel === 'email' ? 'Email' : 'SMS'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bildirim başlığı"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Mesaj</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bildirim mesajı"
              rows={4}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowPreview(true)}
              disabled={!title || !message}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önizle
            </button>
            <button
              onClick={handleSendNotification}
              disabled={sending || !title || !message || channels.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Gönder
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Bildirim Önizleme</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{title}</h4>
                  <p className="text-sm text-white/80">{message}</p>
                  <p className="text-xs text-white/40 mt-2">Şimdi</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-sm text-white/60">
                <span className="font-medium">Hedef:</span> {notificationType === 'all' ? 'Tüm Kullanıcılar' : notificationType === 'users' ? 'Müşteriler' : notificationType === 'businesses' ? 'İşletmeler' : 'Özel Seçim'}
              </p>
              <p className="text-sm text-white/60">
                <span className="font-medium">Kanallar:</span> {channels.map(c => c === 'in-app' ? 'Uygulama İçi' : c === 'push' ? 'Push' : c === 'email' ? 'Email' : 'SMS').join(', ')}
              </p>
            </div>

            <button
              onClick={() => setShowPreview(false)}
              className="w-full mt-6 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
