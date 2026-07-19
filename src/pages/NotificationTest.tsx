/**
 * Notification Test Page
 * Bildirim sisteminin tüm özelliklerini test etmek için
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertCircle, Send, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { pushNotificationService } from '@/services/pushNotificationService';
import { toast } from 'sonner';

export function NotificationTest() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await testFn();
      setTestResults(prev => ({ ...prev, [testName]: true }));
      toast.success(`${testName} Başarılı`, {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [testName]: false }));
      toast.error(`${testName} Başarısız`, {
        description: error.message,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tests = [
    {
      id: 'support',
      name: 'Tarayıcı Desteği',
      description: 'Push bildirimlerinin desteklenip desteklenmediğini kontrol eder',
      icon: <Bell className="h-5 w-5" />,
      run: async () => {
        const isSupported = pushNotificationService.isNotificationSupported();
        if (!isSupported) {
          throw new Error('Tarayıcınız push bildirimleri desteklemiyor');
        }
      },
    },
    {
      id: 'permission',
      name: 'Bildirim İzni',
      description: 'Tarayıcıdan bildirim izni ister',
      icon: <CheckCircle className="h-5 w-5" />,
      run: async () => {
        const granted = await pushNotificationService.requestPermission();
        if (!granted) {
          throw new Error('Bildirim izni reddedildi');
        }
      },
    },
    {
      id: 'register',
      name: 'Cihaz Kaydı',
      description: 'FCM token alır ve Firestore\'a kaydeder',
      icon: <Send className="h-5 w-5" />,
      run: async () => {
        const token = await pushNotificationService.registerDevice(
          user.uid,
          user.role === 'owner' ? 'owner' : 'customer',
          user.salonId
        );
        if (!token) {
          throw new Error('FCM token alınamadı');
        }
      },
    },
    {
      id: 'test-notification',
      name: 'Test Bildirimi',
      description: 'Anında test bildirimi gönderir',
      icon: <Bell className="h-5 w-5" />,
      run: async () => {
        await pushNotificationService.sendTestNotification(user.uid);
      },
    },
    {
      id: 'appointment-reminder',
      name: 'Randevu Hatırlatıcısı',
      description: '1 dakika sonrası için zamanlanmış bildirim oluşturur',
      icon: <Calendar className="h-5 w-5" />,
      run: async () => {
        const scheduledTime = new Date(Date.now() + 60000); // 1 dakika sonra
        
        await pushNotificationService.scheduleNotification({
          userId: user.uid,
          userType: user.role === 'owner' ? 'owner' : 'customer',
          type: 'appointment_reminder',
          scheduledFor: scheduledTime.toISOString(),
          payload: {
            title: 'Test Randevu Hatırlatması',
            body: 'Bu bir test hatırlatmasıdır. 1 dakika sonra gelecek.',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            requireInteraction: true,
            data: {
              type: 'appointment_reminder',
              testMode: 'true',
            },
            actions: [
              { action: 'view', title: '👁️ Görüntüle' },
              { action: 'dismiss', title: '✕ Kapat' },
            ],
          },
        });
        
        toast.info('Zamanlanmış Bildirim', {
          description: 'Test bildirimi 1 dakika sonra gelecek. Tarayıcıyı kapatıp test edebilirsiniz!',
        });
      },
    },
    {
      id: 'business-notification',
      name: 'İşletme Bildirimi',
      description: 'İşletmeye yeni randevu bildirimi gönderir (sadece owner için)',
      icon: <Building2 className="h-5 w-5" />,
      disabled: user.role !== 'owner',
      run: async () => {
        if (user.role !== 'owner' || !user.salonId) {
          throw new Error('Bu test sadece işletme sahipleri için geçerlidir');
        }
        
        await pushNotificationService.notifyBusinessNewAppointment(
          user.salonId,
          'test-appointment-' + Date.now(),
          'Test Müşteri',
          new Date().toLocaleDateString('tr-TR') + ' 14:00',
          ['Saç Kesimi', 'Sakal Traşı']
        );
      },
    },
  ];

  const getTestStatus = (testId: string) => {
    if (testResults[testId] === true) {
      return <Badge variant="default" className="bg-green-500">✓ Başarılı</Badge>;
    }
    if (testResults[testId] === false) {
      return <Badge variant="destructive">✕ Başarısız</Badge>;
    }
    return <Badge variant="secondary">Bekleniyor</Badge>;
  };

  const runAllTests = async () => {
    for (const test of tests) {
      if (!test.disabled) {
        await runTest(test.name, test.run);
        // Testler arası 1 saniye bekle
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    toast.success('Tüm Testler Tamamlandı', {
      description: 'Sonuçları aşağıda görebilirsiniz.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bildirim Sistemi Test Merkezi</h1>
        <p className="text-muted-foreground">
          Bildirim sisteminin tüm özelliklerini test edin ve doğrulayın.
        </p>
      </div>

      {/* Sistem Durumu */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sistem Durumu</CardTitle>
          <CardDescription>Mevcut tarayıcı ve bildirim durumu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Tarayıcı Desteği:</span>
            <Badge variant={pushNotificationService.isNotificationSupported() ? 'default' : 'destructive'}>
              {pushNotificationService.isNotificationSupported() ? 'Destekleniyor' : 'Desteklenmiyor'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Bildirim İzni:</span>
            <Badge variant={
              pushNotificationService.getPermissionStatus() === 'granted' ? 'default' :
              pushNotificationService.getPermissionStatus() === 'denied' ? 'destructive' : 'secondary'
            }>
              {pushNotificationService.getPermissionStatus() === 'granted' ? 'Verildi' :
               pushNotificationService.getPermissionStatus() === 'denied' ? 'Reddedildi' : 'Bekleniyor'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Kullanıcı Tipi:</span>
            <Badge variant="secondary">
              {user.role === 'owner' ? 'İşletme Sahibi' : 'Müşteri'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Test Listesi */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Test Senaryoları</CardTitle>
            <CardDescription>Her bir testi tek tek veya hepsini birden çalıştırın</CardDescription>
          </div>
          <Button onClick={runAllTests} disabled={isLoading}>
            Tümünü Çalıştır
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.map((test) => (
            <div
              key={test.id}
              className={`p-4 rounded-lg border ${test.disabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {test.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{test.name}</h3>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                    {test.disabled && (
                      <p className="text-xs text-amber-600 mt-1">
                        Bu test sizin kullanıcı tipiniz için geçerli değil
                      </p>
                    )}
                  </div>
                </div>
                {getTestStatus(test.id)}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest(test.name, test.run)}
                  disabled={isLoading || test.disabled}
                >
                  Test Et
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Test Sonuçları Özeti */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Sonuçları Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-green-500">
                  {Object.values(testResults).filter(r => r === true).length}
                </div>
                <div className="text-sm text-muted-foreground">Başarılı</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-500">
                  {Object.values(testResults).filter(r => r === false).length}
                </div>
                <div className="text-sm text-muted-foreground">Başarısız</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-500">
                  {tests.filter(t => !t.disabled).length - Object.keys(testResults).length}
                </div>
                <div className="text-sm text-muted-foreground">Bekleyen</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uyarılar */}
      <div className="mt-6 space-y-3">
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          <strong>💡 İpucu:</strong> "Zamanlanmış Bildirim" testini çalıştırdıktan sonra tarayıcıyı kapatıp 
          1 dakika bekleyin. Arka plan bildirimi gelecektir.
        </div>
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <strong>⚠️ Önemli:</strong> Zamanlanmış bildirimlerin çalışması için Firebase Cloud Functions'ın 
          deploy edilmiş olması gerekir. Manuel test bildirimleri her zaman çalışır.
        </div>
      </div>
    </div>
  );
}
