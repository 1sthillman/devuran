import { useEffect, useState } from 'react';
import { Shield, Search, Filter, Eye, Download, AlertTriangle } from 'lucide-react';
import { auditLogService } from '@/services/adminService';

interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  metadata?: any;
  timestamp: string;
  ip: string;
  userAgent: string;
}

export function SecurityLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTargetType, setFilterTargetType] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [searchTerm, filterAction, filterTargetType, logs]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const logsData = await auditLogService.getLogs({ limit: 1000 });
      setLogs(logsData as AuditLog[]);
    } catch (error) {
      console.error('Load logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.adminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    if (filterTargetType !== 'all') {
      filtered = filtered.filter(log => log.targetType === filterTargetType);
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    const csv = [
      ['Tarih', 'Admin', 'İşlem', 'Hedef Tip', 'Hedef', 'IP'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString('tr-TR'),
        log.adminName,
        log.action,
        log.targetType,
        log.targetName,
        log.ip
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('ban')) return 'text-red-400';
    if (action.includes('create') || action.includes('approve')) return 'text-green-400';
    if (action.includes('update') || action.includes('edit')) return 'text-blue-400';
    return 'text-white/80';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('delete') || action.includes('ban')) return <AlertTriangle className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold text-white">Güvenlik Logları</h1>
          <p className="text-white/60 mt-1">Tüm admin işlemlerini görüntüle</p>
        </div>
        <button
          onClick={exportLogs}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Dışa Aktar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-sm">Toplam Log</span>
          </div>
          <p className="text-2xl font-bold text-white">{logs.length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Bugün</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-white/60 text-sm">Kritik İşlem</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {logs.filter(l => l.action.includes('delete') || l.action.includes('ban')).length}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/60 text-sm">Aktif Admin</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {new Set(logs.map(l => l.adminId)).size}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Admin, hedef veya işlem ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={filterTargetType}
            onChange={(e) => setFilterTargetType(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Tipler</option>
            <option value="user">Kullanıcı</option>
            <option value="business">İşletme</option>
            <option value="staff">Personel</option>
            <option value="reservation">Rezervasyon</option>
            <option value="subscription">Abonelik</option>
            <option value="payment">Ödeme</option>
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm İşlemler</option>
            <option value="create">Oluşturma</option>
            <option value="update">Güncelleme</option>
            <option value="delete">Silme</option>
            <option value="ban">Banlama</option>
            <option value="approve">Onaylama</option>
          </select>
        </div>

        <div className="mt-4">
          <p className="text-white/60 text-sm">{filteredLogs.length} log bulundu</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">Tarih</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">Admin</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">İşlem</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">Hedef</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase">IP</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-white/60 uppercase">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                    {new Date(log.timestamp).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{log.adminName}</div>
                    <div className="text-xs text-white/40">{log.adminId.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center gap-2 text-sm font-medium ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      {log.action}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white/80">{log.targetName}</div>
                    <div className="text-xs text-white/40">{log.targetType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                    {log.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailModal(true);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Log Detayı</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Tarih</label>
                  <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString('tr-TR')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Admin</label>
                  <p className="text-white">{selectedLog.adminName}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">İşlem</label>
                <p className="text-white">{selectedLog.action}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Hedef Tip</label>
                  <p className="text-white">{selectedLog.targetType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Hedef</label>
                  <p className="text-white">{selectedLog.targetName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">IP Adresi</label>
                  <p className="text-white">{selectedLog.ip}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">User Agent</label>
                  <p className="text-white text-xs truncate">{selectedLog.userAgent}</p>
                </div>
              </div>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Değişiklikler</label>
                  <div className="space-y-2">
                    {selectedLog.changes.map((change, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-1">{change.field}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-white/40">Eski:</span>
                            <span className="text-red-400 ml-2">{JSON.stringify(change.oldValue)}</span>
                          </div>
                          <div>
                            <span className="text-white/40">Yeni:</span>
                            <span className="text-green-400 ml-2">{JSON.stringify(change.newValue)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Metadata</label>
                  <pre className="text-xs text-white/80 bg-white/5 p-4 rounded-xl overflow-auto max-h-64">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
