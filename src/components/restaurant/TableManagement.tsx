import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, QrCode, Users, Download, Sparkles, Check, X, UtensilsCrossed } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import QRCodeStyling from 'qr-code-styling';
import type { Table } from '@/types/restaurant';

interface TableManagementProps {
  restaurantId: string;
}

export function TableManagement({ restaurantId }: TableManagementProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [area, setArea] = useState('');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState<Table | null>(null);

  useEffect(() => {
    loadTables();
  }, [restaurantId]);

  async function loadTables() {
    try {
      setLoading(true);
      const data = await restaurantService.getTables(restaurantId);
      setTables(data.sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber)));
    } catch (error) {
      console.error('Masa yükleme hatası:', error);
      toast.error('Masalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!tableNumber || !capacity) {
      toast.error('Masa numarası ve kapasite zorunludur', {
        description: 'Lütfen tüm zorunlu alanları doldurun'
      });
      return;
    }

    try {
      if (editingTable) {
        await restaurantService.updateTable(editingTable.id, {
          tableNumber,
          capacity: parseInt(capacity),
          area: area || undefined,
        });
        toast.success('Masa güncellendi!', {
          icon: <Check className="w-5 h-5" />,
        });
      } else {
        await restaurantService.createTable(restaurantId, {
          tableNumber,
          capacity: parseInt(capacity),
          area: area || undefined,
          status: 'empty',
        });
        toast.success('Masa oluşturuldu!', {
          description: `Masa ${tableNumber} başarıyla eklendi`,
          icon: <Check className="w-5 h-5" />,
        });
      }
      
      setShowDialog(false);
      resetForm();
      loadTables();
    } catch (error) {
      console.error('Masa kaydetme hatası:', error);
      toast.error('Masa kaydedilemedi', {
        description: 'Bir hata oluştu, lütfen tekrar deneyin'
      });
    }
  }


  async function handleDelete(tableId: string) {
    try {
      await restaurantService.deleteTable(tableId);
      toast.success('Masa silindi!', {
        icon: <Check className="w-5 h-5" />,
      });
      loadTables();
    } catch (error) {
      console.error('Masa silme hatası:', error);
      toast.error('Masa silinemedi');
    }
  }

  function resetForm() {
    setTableNumber('');
    setCapacity('4');
    setArea('');
    setEditingTable(null);
  }

  function openEditDialog(table: Table) {
    setEditingTable(table);
    setTableNumber(table.tableNumber);
    setCapacity(table.capacity.toString());
    setArea(table.area || '');
    setShowDialog(true);
  }

  function openQRDialog(table: Table) {
    setSelectedTableForQR(table);
    setShowQRDialog(true);
  }

  function downloadQRCode() {
    if (!selectedTableForQR) return;

    const qrCode = new QRCodeStyling({
      width: 512,
      height: 512,
      data: `${window.location.origin}/restaurant/${restaurantId}/table/${selectedTableForQR.qrCode}`,
      image: '/favicon.svg',
      dotsOptions: {
        color: '#f97316',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 10,
      },
    });

    qrCode.download({
      name: `masa-${selectedTableForQR.tableNumber}-qr`,
      extension: 'png',
    });
    
    toast.success('QR kod indiriliyor!', {
      icon: <Check className="w-5 h-5" />,
    });
  }

  function downloadAllQRCodes() {
    if (tables.length === 0) {
      toast.error('İndirilecek QR kod bulunamadı');
      return;
    }

    tables.forEach((table, index) => {
      setTimeout(() => {
        const qrCode = new QRCodeStyling({
          width: 512,
          height: 512,
          data: `${window.location.origin}/restaurant/${restaurantId}/table/${table.qrCode}`,
          image: '/favicon.svg',
          dotsOptions: {
            color: '#f97316',
            type: 'rounded',
          },
          backgroundOptions: {
            color: '#ffffff',
          },
          imageOptions: {
            crossOrigin: 'anonymous',
            margin: 10,
          },
        });

        qrCode.download({
          name: `masa-${table.tableNumber}-qr`,
          extension: 'png',
        });
      }, 200 * index);
    });
    
    toast.success('Tüm QR kodlar indiriliyor!', {
      description: `${tables.length} adet QR kod indirilecek`,
      icon: <Check className="w-5 h-5" />,
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-500 dark:border-orange-400 border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Masalar yükleniyor...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header - Modern with Stats */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl sm:text-3xl font-heading font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent mb-1"
            >
              Masa Yönetimi
            </motion.h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              QR kodlarınızı oluşturun ve masalarınızı yönetin
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {tables.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadAllQRCodes}
                className="flex-1 sm:flex-none px-4 py-3 bg-white dark:bg-white/[0.03] border-2 border-gray-200 dark:border-white/10 hover:border-orange-500 dark:hover:border-orange-500 text-gray-700 dark:text-gray-300 rounded-2xl font-heading font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-5 h-5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Tüm QR Kodları İndir</span>
                <span className="sm:hidden">Tümünü İndir</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDialog(true)}
              className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl shadow-lg shadow-orange-500/20 font-heading font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Masa Ekle
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Masa', value: tables.length, icon: UtensilsCrossed, gradient: 'from-orange-500 to-red-500' },
            { label: 'Boş Masalar', value: tables.filter(t => t.status === 'empty').length, icon: Check, gradient: 'from-green-500 to-emerald-500' },
            { label: 'Dolu Masalar', value: tables.filter(t => t.status === 'occupied').length, icon: Users, gradient: 'from-blue-500 to-cyan-500' },
            { label: 'QR Kodlar', value: tables.length, icon: QrCode, gradient: 'from-purple-500 to-pink-500' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                'group relative p-5 rounded-3xl border transition-all cursor-pointer overflow-hidden',
                'bg-white dark:bg-white/[0.03]',
                'border-gray-200/80 dark:border-white/10',
                'hover:border-gray-300 dark:hover:border-white/20',
                'shadow-lg shadow-black/5 dark:shadow-none',
                'hover:scale-[1.02]'
              )}
            >
              <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br', stat.gradient)} />
              
              <div className="relative">
                <div className={cn('inline-flex p-3 rounded-2xl bg-gradient-to-br shadow-lg mb-4', stat.gradient)}>
                  <stat.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>


      {/* Tables Grid - Modern Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {tables.map((table, idx) => {
            return (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.03 }}
                layout
                className="group relative"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-3xl blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-gradient-to-br from-orange-500 to-red-500" style={{ filter: 'blur(40px)' }} />
                
                {/* Card */}
                <div className={cn(
                  'relative rounded-3xl overflow-hidden transition-all duration-300',
                  'bg-white dark:bg-white/[0.03]',
                  'border border-gray-200/80 dark:border-white/10',
                  'hover:border-gray-300 dark:hover:border-white/20',
                  'shadow-lg shadow-black/5 dark:shadow-none',
                  'group-hover:scale-[1.02]'
                )}>
                  {/* Content */}
                  <div className="p-5">
                    {/* Table Number */}
                    <div className="text-center mb-4">
                      <div className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                        {table.tableNumber}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" strokeWidth={2.5} />
                        <span className="font-semibold">{table.capacity} kişi</span>
                      </div>
                      {table.area && (
                        <div className="mt-2 px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 inline-block">
                          {table.area}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => openQRDialog(table)}
                        className="w-full px-3 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4" strokeWidth={2.5} />
                        QR Kod
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditDialog(table)}
                          className="flex-1 p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all hover:scale-105"
                        >
                          <Edit className="w-4 h-4 mx-auto" strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Masa ${table.tableNumber}'i silmek istediğinizden emin misiniz?`)) {
                              handleDelete(table.id);
                            }
                          }}
                          className="flex-1 p-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all hover:scale-105"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Add New Table Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: tables.length * 0.03 }}
            layout
            className="group relative"
          >
            <div
              onClick={() => setShowDialog(true)}
              className={cn(
                'relative rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer min-h-[220px] flex items-center justify-center',
                'bg-white dark:bg-white/[0.03]',
                'border-2 border-dashed border-gray-300 dark:border-white/20',
                'hover:border-orange-500 dark:hover:border-orange-500',
                'hover:bg-gray-50 dark:hover:bg-white/[0.05]',
                'group-hover:scale-[1.02]'
              )}
            >
              <div className="text-center p-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center mx-auto mb-4 group-hover:from-orange-500 group-hover:to-red-500 transition-all">
                  <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-white transition-colors" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Yeni Masa
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {tables.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'text-center py-16 px-6 rounded-3xl',
            'bg-white dark:bg-white/[0.03]',
            'border-2 border-dashed border-gray-300 dark:border-white/10'
          )}
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/10 dark:to-red-500/10 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-10 h-10 text-orange-500 dark:text-orange-400" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
            Henüz masa eklenmedi
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            İlk masanızı ekleyerek başlayın
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl shadow-lg shadow-orange-500/20 font-heading font-bold transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            İlk Masayı Ekle
          </button>
        </motion.div>
      )}

      {/* Add/Edit Table Modal */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
            onClick={() => setShowDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'rounded-3xl p-6 max-w-md w-full',
                'bg-white dark:bg-[#0a0a0a]',
                'border border-gray-200 dark:border-white/10',
                'shadow-2xl'
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    {editingTable ? (
                      <Edit className="w-5 h-5 text-white" strokeWidth={2.5} />
                    ) : (
                      <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                    )}
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                    {editingTable ? 'Masayı Düzenle' : 'Yeni Masa Ekle'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Table Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Masa Numarası *
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Örn: 1, A1, VIP-1"
                    className={cn(
                      'w-full px-4 py-3 rounded-2xl font-medium transition-all',
                      'bg-gray-50 dark:bg-white/5',
                      'border-2 border-gray-200 dark:border-white/10',
                      'focus:border-orange-500 dark:focus:border-orange-500 focus:ring-0',
                      'text-gray-900 dark:text-white',
                      'placeholder-gray-500 dark:placeholder-gray-500'
                    )}
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Kapasite (Kişi) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="4"
                    className={cn(
                      'w-full px-4 py-3 rounded-2xl font-mono font-bold text-lg transition-all',
                      'bg-gray-50 dark:bg-white/5',
                      'border-2 border-gray-200 dark:border-white/10',
                      'focus:border-orange-500 dark:focus:border-orange-500 focus:ring-0',
                      'text-gray-900 dark:text-white',
                      'placeholder-gray-500 dark:placeholder-gray-500'
                    )}
                  />
                </div>

                {/* Area (Optional) */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Bölge / Alan (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    list="existing-areas"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Örn: Bahçe, İç Mekan, VIP"
                    className={cn(
                      'w-full px-4 py-3 rounded-2xl font-medium transition-all',
                      'bg-gray-50 dark:bg-white/5',
                      'border-2 border-gray-200 dark:border-white/10',
                      'focus:border-orange-500 dark:focus:border-orange-500 focus:ring-0',
                      'text-gray-900 dark:text-white',
                      'placeholder-gray-500 dark:placeholder-gray-500'
                    )}
                  />
                  {/* Existing areas datalist */}
                  <datalist id="existing-areas">
                    {Array.from(new Set(tables.filter(t => t.area).map(t => t.area))).map((areaName) => (
                      <option key={areaName} value={areaName} />
                    ))}
                  </datalist>
                  {tables.filter(t => t.area).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from(new Set(tables.filter(t => t.area).map(t => t.area))).map((areaName) => (
                        <button
                          key={areaName}
                          type="button"
                          onClick={() => setArea(areaName!)}
                          className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full transition-all"
                        >
                          {areaName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                  className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
                >
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                  {editingTable ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRDialog && selectedTableForQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
            onClick={() => setShowQRDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'rounded-3xl p-6 max-w-md w-full',
                'bg-white dark:bg-[#0a0a0a]',
                'border border-gray-200 dark:border-white/10',
                'shadow-2xl'
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                      Masa {selectedTableForQR.tableNumber}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">QR Kod</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQRDialog(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-5">
                {/* QR Code Preview */}
                <div className="flex justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 rounded-2xl">
                  <div className="p-4 bg-white rounded-2xl shadow-xl">
                    <QRCodePreview
                      data={`${window.location.origin}/restaurant/${restaurantId}/table/${selectedTableForQR.qrCode}`}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border-2 border-blue-200 dark:border-blue-500/20">
                  <p className="text-sm text-blue-900 dark:text-blue-300 font-medium text-center">
                    Müşteriler bu QR kodu okutarak masanızdan direkt sipariş verebilir
                  </p>
                </div>

                {/* Download Button */}
                <button
                  onClick={downloadQRCode}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-bold transition-all hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" strokeWidth={2.5} />
                  QR Kodu İndir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// QR Code Preview Component
function QRCodePreview({ data }: { data: string }) {
  useEffect(() => {
    const qrCode = new QRCodeStyling({
      width: 256,
      height: 256,
      data,
      image: '/favicon.svg',
      dotsOptions: {
        color: '#f97316',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 5,
      },
    });

    const container = document.getElementById('qr-preview-container');
    if (container) {
      container.innerHTML = '';
      qrCode.append(container);
    }
  }, [data]);

  return <div id="qr-preview-container" />;
}