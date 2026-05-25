import { useEffect, useState } from 'react';
import { Search, Calendar, MapPin, Phone, Edit, Trash2, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Reservation } from '@/types';

export function ReservationManagement() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReservation, setNewReservation] = useState({
    userName: '',
    userPhone: '',
    userEmail: '',
    businessName: '',
    businessId: '',
    status: 'pending' as const,
    notes: '',
  });

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [searchTerm, filterStatus, reservations]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
      const reservationsData = reservationsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Reservation[];
      
      setReservations(reservationsData);
    } catch (error) {
      console.error('Load reservations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    if (searchTerm) {
      filtered = filtered.filter(res =>
        res.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.userPhone?.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(res => res.status === filterStatus);
    }

    setFilteredReservations(filtered);
  };

  const handleUpdateStatus = async (reservationId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reservations', reservationId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await loadReservations();
      alert('Durum güncellendi!');
    } catch (error) {
      console.error('Update status error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleSaveReservation = async () => {
    if (!editingReservation) return;
    
    try {
      await updateDoc(doc(db, 'reservations', editingReservation.id), {
        userName: editingReservation.userName,
        userPhone: editingReservation.userPhone,
        userEmail: editingReservation.userEmail,
        status: editingReservation.status,
        notes: editingReservation.notes,
        updatedAt: new Date().toISOString(),
      });
      await loadReservations();
      setShowEditModal(false);
      setEditingReservation(null);
      alert('Rezervasyon güncellendi!');
    } catch (error) {
      console.error('Update reservation error:', error);
      alert('Hata: ' + error);
    }
  };

  const handleAddReservation = async () => {
    if (!newReservation.userName || !newReservation.userPhone || !newReservation.businessName) {
      alert('Lütfen gerekli alanları doldurun!');
      return;
    }

    try {
      await addDoc(collection(db, 'reservations'), {
        ...newReservation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await loadReservations();
      setShowAddModal(false);
      setNewReservation({
        userName: '',
        userPhone: '',
        userEmail: '',
        businessName: '',
        businessId: '',
        status: 'pending',
        notes: '',
      });
      alert('Rezervasyon eklendi!');
    } catch (error) {
      console.error('Add reservation error:', error);
      alert('Hata: ' + error);
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
          <h1 className="text-3xl font-bold text-white">Rezervasyon Yönetimi</h1>
          <p className="text-white/60 mt-1">Tüm rezervasyonları görüntüle ve yönet</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Rezervasyon Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="İsim, işletme veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="confirmed">Onaylandı</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal Edildi</option>
          </select>
        </div>

        <div className="mt-4">
          <p className="text-white/60 text-sm">{filteredReservations.length} rezervasyon bulundu</p>
        </div>
      </div>

      {/* Reservations List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{reservation.userName}</h3>
                  <span className={`
                    px-3 py-1 text-xs font-semibold rounded-full
                    ${reservation.status === 'confirmed' ? 'bg-green-500/20 text-green-300' : ''}
                    ${reservation.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                    ${reservation.status === 'completed' ? 'bg-blue-500/20 text-blue-300' : ''}
                    ${reservation.status.includes('cancelled') ? 'bg-red-500/20 text-red-300' : ''}
                  `}>
                    {reservation.status === 'confirmed' && 'Onaylandı'}
                    {reservation.status === 'pending' && 'Beklemede'}
                    {reservation.status === 'completed' && 'Tamamlandı'}
                    {reservation.status.includes('cancelled') && 'İptal'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <MapPin className="w-4 h-4" />
                    <span>{reservation.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone className="w-4 h-4" />
                    <span>{reservation.userPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(reservation.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingReservation(reservation);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Düzenle
                </button>
                {reservation.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(reservation.id, 'confirmed')}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl text-sm font-medium transition-colors"
                  >
                    Onayla
                  </button>
                )}
                {reservation.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(reservation.id, 'completed')}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-sm font-medium transition-colors"
                  >
                    Tamamla
                  </button>
                )}
                {!reservation.status.includes('cancelled') && (
                  <button
                    onClick={() => handleUpdateStatus(reservation.id, 'cancelled_by_business')}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-medium transition-colors"
                  >
                    İptal Et
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) {
                      await deleteDoc(doc(db, 'reservations', reservation.id));
                      await loadReservations();
                      alert('Rezervasyon silindi!');
                    }
                  }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingReservation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Rezervasyon Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReservation(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Müşteri Adı</label>
                <input
                  type="text"
                  value={editingReservation.userName}
                  onChange={(e) => setEditingReservation({ ...editingReservation, userName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={editingReservation.userPhone}
                    onChange={(e) => setEditingReservation({ ...editingReservation, userPhone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingReservation.userEmail}
                    onChange={(e) => setEditingReservation({ ...editingReservation, userEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Durum</label>
                <select
                  value={editingReservation.status}
                  onChange={(e) => setEditingReservation({ ...editingReservation, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled_by_business">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Notlar</label>
                <textarea
                  value={editingReservation.notes || ''}
                  onChange={(e) => setEditingReservation({ ...editingReservation, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveReservation}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingReservation(null);
                  }}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Yeni Rezervasyon Ekle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Müşteri Adı *</label>
                <input
                  type="text"
                  value={newReservation.userName}
                  onChange={(e) => setNewReservation({ ...newReservation, userName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    value={newReservation.userPhone}
                    onChange={(e) => setNewReservation({ ...newReservation, userPhone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <input
                    type="email"
                    value={newReservation.userEmail}
                    onChange={(e) => setNewReservation({ ...newReservation, userEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">İşletme Adı *</label>
                  <input
                    type="text"
                    value={newReservation.businessName}
                    onChange={(e) => setNewReservation({ ...newReservation, businessName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">İşletme ID</label>
                  <input
                    type="text"
                    value={newReservation.businessId}
                    onChange={(e) => setNewReservation({ ...newReservation, businessId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Durum</label>
                <select
                  value={newReservation.status}
                  onChange={(e) => setNewReservation({ ...newReservation, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled_by_business">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Notlar</label>
                <textarea
                  value={newReservation.notes}
                  onChange={(e) => setNewReservation({ ...newReservation, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddReservation}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  Ekle
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
