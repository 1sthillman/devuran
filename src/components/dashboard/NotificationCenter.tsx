/**
 * Notification Center Component
 * Dashboard için bildirim merkezi - Ön planda gelen bildirimleri gösterir
 */

import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pushNotificationService } from '@/services/pushNotificationService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, string>;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Ön planda bildirim dinle
    const unsubscribe = pushNotificationService.onForegroundMessage((payload) => {
      const newNotification: NotificationItem = {
        id: Date.now().toString(),
        title: payload.notification?.title || 'Yeni Bildirim',
        body: payload.notification?.body || '',
        type: payload.data?.type || 'general',
        timestamp: new Date().toISOString(),
        read: false,
        data: payload.data,
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Toast bildirimi göster
      toast.info(newNotification.title, {
        description: newNotification.body,
        action: {
          label: 'Görüntüle',
          onClick: () => {
            setIsOpen(true);
            markAsRead(newNotification.id);
          },
        },
      });
    });

    return unsubscribe;
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
      case 'appointment_today':
      case 'appointment_confirmed':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'appointment_cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'new_appointment':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'queue_ready':
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Bildirimler
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} Yeni
                </Badge>
              )}
            </SheetTitle>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Tümünü Okundu İşaretle
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Temizle
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Henüz bildirim yok</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.read
                        ? 'bg-background border-border'
                        : 'bg-accent/50 border-primary/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm line-clamp-1">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {notification.body}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-7 text-xs"
                            >
                              Okundu İşaretle
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
