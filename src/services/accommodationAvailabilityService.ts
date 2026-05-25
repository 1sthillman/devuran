import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Service } from '@/types';

export interface RoomAvailability {
  roomId: string;
  roomName: string;
  isAvailable: boolean;
  bookedDates: string[];
  price: number;
}

class AccommodationAvailabilityService {
  
  /**
   * Belirli bir tarih aralığında odaların müsaitliğini kontrol eder
   */
  async checkRoomAvailability(
    businessId: string,
    roomId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<boolean> {
    try {
      const checkInStr = checkIn.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];

      // Bu oda için bu tarih aralığında rezervasyon var mı kontrol et
      const q = query(
        collection(db, 'reservations'),
        where('type', '==', 'nightly'),
        where('businessId', '==', businessId),
        where('roomType', '==', roomId),
        where('status', 'in', ['confirmed', 'deposit_paid', 'fully_paid', 'in_progress'])
      );

      const snapshot = await getDocs(q);
      
      // Tarih çakışması kontrolü
      for (const doc of snapshot.docs) {
        const reservation = doc.data();
        const resCheckIn = new Date(reservation.checkIn);
        const resCheckOut = new Date(reservation.checkOut);

        // Tarihler çakışıyor mu?
        if (
          (checkIn >= resCheckIn && checkIn < resCheckOut) ||
          (checkOut > resCheckIn && checkOut <= resCheckOut) ||
          (checkIn <= resCheckIn && checkOut >= resCheckOut)
        ) {
          return false; // Çakışma var, müsait değil
        }
      }

      return true; // Müsait
    } catch (error) {
      console.error('Oda müsaitlik kontrolü hatası:', error);
      return false;
    }
  }

  /**
   * Tüm odaların müsaitliğini kontrol eder ve alternatif önerir
   */
  async getAvailableRooms(
    businessId: string,
    rooms: Service[],
    checkIn: Date,
    checkOut: Date
  ): Promise<RoomAvailability[]> {
    const availabilities: RoomAvailability[] = [];

    for (const room of rooms) {
      const isAvailable = await this.checkRoomAvailability(
        businessId,
        room.id,
        checkIn,
        checkOut
      );

      availabilities.push({
        roomId: room.id,
        roomName: room.name,
        isAvailable,
        bookedDates: [], // İleride dolu günleri göstermek için kullanılabilir
        price: room.price
      });
    }

    return availabilities;
  }

  /**
   * Belirli bir oda için yakın tarihlerde müsait günleri bulur
   */
  async findNearbyAvailableDates(
    businessId: string,
    roomId: string,
    preferredDate: Date,
    nights: number,
    daysToCheck: number = 14
  ): Promise<Date[]> {
    const availableDates: Date[] = [];

    for (let i = 0; i < daysToCheck; i++) {
      const checkIn = new Date(preferredDate);
      checkIn.setDate(checkIn.getDate() + i);
      
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + nights);

      const isAvailable = await this.checkRoomAvailability(
        businessId,
        roomId,
        checkIn,
        checkOut
      );

      if (isAvailable) {
        availableDates.push(checkIn);
      }
    }

    return availableDates;
  }
}

export const accommodationAvailabilityService = new AccommodationAvailabilityService();
