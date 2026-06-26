import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Table } from '@/types/restaurant';

interface TableTransferDialogProps {
  open: boolean;
  onClose: () => void;
  sourceTable: Table | null;
  availableTables: Table[];
  onTransfer: (targetTableId: string) => Promise<void>;
}

export function TableTransferDialog({
  open,
  onClose,
  sourceTable,
  availableTables,
  onTransfer
}: TableTransferDialogProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  async function handleConfirm() {
    if (!selectedTableId) return;

    try {
      setTransferring(true);
      await onTransfer(selectedTableId);
      onClose();
    } catch (error) {
      console.error('Transfer error:', error);
    } finally {
      setTransferring(false);
    }
  }

  // Filter empty tables only - check if sourceTable exists
  const emptyTables = availableTables.filter(t => t.status === 'empty' && t.id !== sourceTable?.id);
  
  // If no sourceTable, don't render
  if (!sourceTable) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10002]"
            onClick={onClose}
            style={{ position: 'fixed' }}
          />
        )}
      </AnimatePresence>

      {/* Dialog - Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-[10003] px-4 pb-4"
            style={{ 
              position: 'fixed',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
              maxHeight: '85vh'
            }}
          >
            <div className="max-w-2xl mx-auto">
              {/* Handle */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-1.5 bg-white/40 rounded-full" />
              </div>

              {/* Content */}
              <div className="bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5" />
                        Masa Taşı
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Masa {sourceTable.tableNumber} → Boş masa seçin
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Available Tables - Scrollable */}
                <div className="p-4 overflow-y-auto flex-1">
                  {emptyTables.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <ArrowRightLeft className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Boş masa bulunmuyor</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {emptyTables.map((table) => {
                        const isSelected = selectedTableId === table.id;

                        return (
                          <motion.button
                            key={table.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTableId(table.id)}
                            className={cn(
                              'relative aspect-square rounded-2xl p-4 transition-all border-2',
                              'bg-white dark:bg-white/5',
                              isSelected
                                ? 'border-green-500 dark:border-green-400 shadow-lg shadow-green-500/20'
                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                            )}
                          >
                            {/* Selected Check */}
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                              >
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                              </motion.div>
                            )}

                            <div className="flex flex-col items-center justify-center h-full gap-2">
                              <div className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                                {table.tableNumber}
                              </div>
                              {table.area && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  {table.area}
                                </div>
                              )}
                              <div className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                Boş
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer - Actions */}
                {emptyTables.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0 space-y-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirm}
                      disabled={!selectedTableId || transferring}
                      className={cn(
                        'w-full h-12 rounded-full font-heading font-bold text-white transition-all',
                        selectedTableId && !transferring
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg'
                          : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'
                      )}
                    >
                      {transferring ? 'Taşınıyor...' : 'Taşımayı Onayla'}
                    </motion.button>
                    <button
                      onClick={onClose}
                      className="w-full h-11 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white font-heading font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                    >
                      İptal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
