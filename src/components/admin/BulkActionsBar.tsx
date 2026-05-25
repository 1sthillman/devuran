import { useState } from 'react';
import { Trash2, Ban, CheckCircle, Star, Send, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkBan: () => void;
  onBulkDelete: () => void;
  onBulkGrantPremium: () => void;
  onBulkNotify: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onBulkBan,
  onBulkDelete,
  onBulkGrantPremium,
  onBulkNotify,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-slate-800 border border-white/20 rounded-2xl shadow-2xl p-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{selectedCount}</span>
            </div>
            <span className="text-white font-medium">seçili</span>
          </div>

          <div className="h-6 w-px bg-white/20" />

          <div className="flex items-center gap-2">
            <button
              onClick={onBulkBan}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              title="Toplu Banla"
            >
              <Ban className="w-4 h-4" />
              Banla
            </button>

            <button
              onClick={onBulkGrantPremium}
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              title="Toplu Premium Ver"
            >
              <Star className="w-4 h-4" />
              Premium
            </button>

            <button
              onClick={onBulkNotify}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              title="Toplu Bildirim"
            >
              <Send className="w-4 h-4" />
              Bildirim
            </button>

            <button
              onClick={onBulkDelete}
              className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              title="Toplu Sil"
            >
              <Trash2 className="w-4 h-4" />
              Sil
            </button>
          </div>

          <div className="h-6 w-px bg-white/20" />

          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
            title="Seçimi Temizle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
