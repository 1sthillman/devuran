import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, MoveHorizontal, Users, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Table, Order } from '@/types/restaurant';
import { TableTransferDialog } from './TableTransferDialog';

interface TableGridProps {
  tables: Table[];
  orders: Order[];
  onTableClick?: (table: Table) => void;
  onTableLongPress?: (table: Table) => void;
}

export function TableGrid({ tables, orders, onTableClick, onTableLongPress }: TableGridProps) {
  const [transferDialog, setTransferDialog] = useState<{ table: Table; order: Order } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);

  function getTableStatusColor(status: string): string {
    switch (status) {
      case 'empty':
        return 'bg-gray-100 border-gray-300 hover:bg-gray-200 dark:bg-white/[0.03] dark:border-white/10 dark:hover:bg-white/[0.05]';
      case 'reserved':
        return 'bg-blue-100 border-blue-400 hover:bg-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 dark:hover:bg-blue-500/20';
      case 'occupied':
      case 'ordering':
        return 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:hover:bg-yellow-500/20';
      case 'order_placed':
        return 'bg-orange-100 border-orange-400 hover:bg-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30 dark:hover:bg-orange-500/20';
      case 'preparing':
        return 'bg-purple-100 border-purple-400 hover:bg-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30 dark:hover:bg-purple-500/20';
      case 'ready':
        return 'bg-green-100 border-green-400 hover:bg-green-200 dark:bg-green-500/10 dark:border-green-500/30 dark:hover:bg-green-500/20';
      case 'waiter_picking':
        return 'bg-indigo-100 border-indigo-400 hover:bg-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:hover:bg-indigo-500/20';
      case 'delivered':
        return 'bg-teal-100 border-teal-400 hover:bg-teal-200 dark:bg-teal-500/10 dark:border-teal-500/30 dark:hover:bg-teal-500/20';
      case 'bill_requested':
        return 'bg-red-100 border-red-400 hover:bg-red-200 animate-pulse dark:bg-red-500/10 dark:border-red-500/30 dark:hover:bg-red-500/20';
      case 'waiter_called':
        return 'bg-blue-100 border-blue-400 hover:bg-blue-200 animate-pulse dark:bg-blue-500/10 dark:border-blue-500/30 dark:hover:bg-blue-500/20';
      case 'coal_requested':
        return 'bg-orange-100 border-orange-500 hover:bg-orange-200 animate-pulse shadow-lg shadow-orange-500/50 dark:bg-orange-500/20 dark:border-orange-400 dark:hover:bg-orange-500/30';
      case 'moving':
        return 'bg-gray-200 border-gray-400 dark:bg-white/[0.05] dark:border-white/20';
      default:
        return 'bg-gray-100 border-gray-300 dark:bg-white/[0.03] dark:border-white/10';
    }
  }

  function getTableStatusText(status: string): string {
    switch (status) {
      case 'empty':
        return 'Boş';
      case 'reserved':
        return 'Rezerve';
      case 'occupied':
        return 'Dolu';
      case 'ordering':
        return 'Menüye Bakıyor';
      case 'order_placed':
        return 'Sipariş Verildi';
      case 'preparing':
        return 'Hazırlanıyor';
      case 'ready':
        return 'Hazır';
      case 'waiter_picking':
        return 'Teslim Alınıyor';
      case 'delivered':
        return 'Teslim Edildi';
      case 'bill_requested':
        return 'Hesap İstiyor';
      case 'waiter_called':
        return 'Garson Çağırıyor';
      case 'coal_requested':
        return 'Köz İstiyor';
      case 'moving':
        return 'Taşınıyor';
      default:
        return status;
    }
  }

  function getTableOrder(tableId: string): Order | undefined {
    return orders.find(order => order.tableId === tableId && order.status !== 'completed' && order.status !== 'cancelled');
  }

  // Masa için toplam tutarı hesapla (tüm aktif siparişlerin toplamı)
  function getTableTotal(tableId: string): number {
    const tableOrders = orders.filter(order => 
      order.tableId === tableId && 
      ['delivered', 'ready', 'preparing', 'order_placed'].includes(order.status)
    );
    return tableOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  }

  // Masa için toplam ürün sayısını hesapla
  function getTableItemCount(tableId: string): number {
    const tableOrders = orders.filter(order => 
      order.tableId === tableId && 
      ['delivered', 'ready', 'preparing', 'order_placed'].includes(order.status)
    );
    return tableOrders.reduce((sum, order) => sum + order.items.length, 0);
  }

  function handleTableLongPress(table: Table) {
    if (onTableLongPress) {
      onTableLongPress(table);
    } else {
      const order = getTableOrder(table.id);
      if (order && table.status !== 'empty') {
        setTransferDialog({ table, order });
      }
    }
  }

  function handlePointerDown(table: Table) {
    const timer = setTimeout(() => {
      handleTableLongPress(table);
    }, 500); // 500ms basılı tutma
    setLongPressTimer(timer);
  }

  function handlePointerUp() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tables.map((table) => {
          const order = getTableOrder(table.id);
          const isEmpty = table.status === 'empty';

          return (
            <Card
              key={table.id}
              className={cn(
                'relative p-4 border-2 cursor-pointer transition-all select-none',
                getTableStatusColor(table.status)
              )}
              onClick={() => !isEmpty && onTableClick?.(table)}
              onPointerDown={() => handlePointerDown(table)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Masa Numarası */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{table.tableNumber}</div>
                  {table.status === 'coal_requested' && (
                    <Flame className="h-6 w-6 text-orange-500 animate-pulse" strokeWidth={2.5} />
                  )}
                </div>
                <Badge variant="secondary" className="mt-1 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  <Users className="h-3 w-3 mr-1" />
                  {table.capacity}
                </Badge>
              </div>

              {/* Durum */}
              <div className="text-center">
                <Badge
                  className={cn(
                    'text-xs font-medium',
                    table.status === 'coal_requested' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse shadow-lg'
                      : 'bg-gray-700 dark:bg-white text-white dark:text-gray-900',
                    table.status.includes('call') || table.status.includes('request') 
                      ? 'animate-pulse' 
                      : ''
                  )}
                >
                  {table.status === 'coal_requested' && <Flame className="h-3 w-3 mr-1 inline" />}
                  {getTableStatusText(table.status)}
                </Badge>
              </div>

              {/* Sipariş Bilgisi - TÜM SİPARİŞLERİN TOPLAMI */}
              {!isEmpty && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-medium">
                      {order ? order.orderNumber : 'Sipariş'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTableItemCount(table.id)} ürün
                    </span>
                  </div>
                  <div className="text-xs font-bold mt-1 text-gray-900 dark:text-white">
                    {getTableTotal(table.id).toFixed(2)} ₺
                  </div>
                </div>
              )}

              {/* Menü */}
              {!isEmpty && order && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem onClick={() => setTransferDialog({ table, order })} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MoveHorizontal className="h-4 w-4 mr-2" />
                      Masa Taşı
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </Card>
          );
        })}
      </div>

      {/* Masa Taşıma Dialog */}
      {transferDialog && (
        <TableTransferDialog
          sourceTable={transferDialog.table}
          availableTables={tables}
          open={!!transferDialog}
          onClose={() => setTransferDialog(null)}
          onTransfer={async (targetTableId) => {
            // TODO: Implement table transfer logic in restaurantService
            console.log('Transfer from', transferDialog.table.id, 'to', targetTableId);
          }}
        />
      )}
    </>
  );
}
