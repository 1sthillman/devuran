/**
 * Notification Setup Component
 * Kullanıcıların bildirimleri etkinleştirmesi için modern UI
 */

import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { pushNotificationService } from '@/services/pushNotificationService';
import { toast } from 'sonner';

interface NotificationSetupProps {
  userId: string;
  userType: 'customer' | 'owner';
  businessId?: string;
}

export function NotificationSetup({ userId, userType, businessId }: NotificationSetupProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = () => {
    const supported = pushNotificationService.isNotificationSupported();
    const currentPermission = pushNotificationService.getPermissionStatus();
    
    setIsSupported(supported);
    setPermission(currentPermission);
    setIsEnabled(currentPermission === 'granted');
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const token = await pushNotificationService.registerDevice(userId, userType, businessId);
      
      if (token) {
        setPermission('granted');
        setIsEnabled(true);
        toast.success('Bildirimler Aktif', {
          description: 'Artık randevu hatırlatmaları ve önemli güncellemeleri alacaksınız.',
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
        
        // Test bildirimi gönder
        setTimeout(() => {
          pushNotificationService.sendTestNotification(userId);
        }, 1000);
      } else {
        toast.error('Bildirimler Aktif Edilemedi', {
          description: 'Tarayıcı ayarlarınızdan bildirimlere izin verdiğinizden emin olun.',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        });
      }
    } catch (error) {
      console.error('Bildirim etkinleştirme hatası:', error);
      toast.error('Bir hata oluştu', {
        description: 'Lütfen daha sonra tekrar deneyin.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    
    try {
      await pushNotificationService.disableNotifications(userId, userType);
      setIsEnabled(false);
      toast.info('Bildirimler Devre Dışı', {
        description: 'Artık bildirim almayacaksınız.',
      });
    } catch (error) {
      console.error('Bildirim devre dışı bırakma hatası:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.sendTestNotification(userId);
      toast.success('Test bildirimi gönderildi!');
    } catch (error) {
      toast.error('Test bildirimi gönderilemedi');
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            <div>
              <CardTitle>Bildirimler Desteklenmiyor</CardTitle>
              <CardDescription>
                Tarayıcınız push bildirimleri desteklemiyor. Chrome, Firefox veya Edge kullanmanızı öneririz.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <Bell className="h-6 w-6 text-primary" />
            ) : (
              <BellOff className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle>Anlık Bildirimler</CardTitle>
              <CardDescription>
                {userType === 'customer' 
                  ? 'Randevu hatırlatmaları ve önemli güncellemeleri alın'
                  : 'Yeni randevular ve müşteri güncellemeleri hakkında anında bilgilenin'
                }
              </CardDescription>
            </div>
          </div>
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Bildirim Durumu */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Bildirimleri Etkinleştir
            </Label>
            <Switch
              id="notifications"
              checked={isEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleEnableNotifications();
                } else {
                  handleDisableNotifications();
                }
              }}
              disabled={isLoading || permission === 'denied'}
            />
          </div>
          
          {permission === 'denied' && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              Bildirimler engellenmiş. Tarayıcı ayarlarınızdan bu site için bildirimlere izin verin.
            </div>
          )}
        </div>

        {/* Bildirim Özellikleri */}
        {userType === 'customer' ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Alacağınız Bildirimler:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Randevu 24 saat öncesi hatırlatma
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Randevu 1 saat öncesi hatırlatma
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Randevu onaylandı bildirimi
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Sıra durumu güncellemeleri
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Ödeme hatırlatmaları
              </li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Alacağınız Bildirimler:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Yeni randevu talepleri
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Randevu iptalleri
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Ödeme bildirimleri
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Müşteri mesajları
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Yorum ve değerlendirmeler
              </li>
            </ul>
          </div>
        )}

        {/* Test Butonu */}
        {isEnabled && (
          <Button
            variant="outline"
            onClick={handleTestNotification}
            className="w-full"
          >
            Test Bildirimi Gönder
          </Button>
        )}

        {/* Tarayıcı Uyumluluk Bilgisi */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <p className="font-medium mb-1">Desteklenen Tarayıcılar:</p>
          <p>Chrome, Firefox, Edge, Opera, Samsung Internet</p>
          <p className="mt-1 text-amber-600">Not: Safari'de sınırlı destek vardır.</p>
        </div>
      </CardContent>
    </Card>
  );
}
