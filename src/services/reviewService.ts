import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { sanitizeObject, sanitizeInput, containsXSS } from '@/utils/sanitize';
import type { Review } from '@/types';

class ReviewService {
  private collectionName = 'reviews';

  /**
   * Create a new review
   */
  async createReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    // Security: Sanitize inputs
    const sanitizedData = sanitizeObject(data);

    if (sanitizedData.comment && containsXSS(sanitizedData.comment)) {
      throw new Error('Geçersiz karakter tespit edildi');
    }

    // Validate rating
    if (sanitizedData.rating < 1 || sanitizedData.rating > 5) {
      throw new Error('Puan 1-5 arasında olmalıdır');
    }

    if (sanitizedData.staffRating < 1 || sanitizedData.staffRating > 5) {
      throw new Error('Personel puanı 1-5 arasında olmalıdır');
    }

    const reviewId = doc(collection(db, this.collectionName)).id;
    const review: Review = {
      ...sanitizedData,
      id: reviewId,
      createdAt: new Date().toISOString(),
    } as Review;

    await runTransaction(db, async (transaction) => {
      // Create review
      const reviewRef = doc(db, this.collectionName, reviewId);
      transaction.set(reviewRef, review);

      // Update salon stats
      const salonRef = doc(db, 'salons', sanitizedData.salonId);
      const salonDoc = await transaction.get(salonRef);
      
      if (salonDoc.exists()) {
        const currentStats = salonDoc.data().stats || { averageRating: 0, reviewCount: 0 };
        const newReviewCount = currentStats.reviewCount + 1;
        const newAverageRating = 
          (currentStats.averageRating * currentStats.reviewCount + sanitizedData.rating) / newReviewCount;

        transaction.update(salonRef, {
          'stats.averageRating': Number(newAverageRating.toFixed(2)),
          'stats.reviewCount': newReviewCount,
        });
      }

      // Update staff stats
      if (sanitizedData.staffId) {
        const staffRef = doc(db, 'staff', sanitizedData.staffId);
        const staffDoc = await transaction.get(staffRef);
        
        if (staffDoc.exists()) {
          const currentRating = staffDoc.data().rating || 0;
          const currentCount = staffDoc.data().reviewCount || 0;
          const newCount = currentCount + 1;
          const newRating = (currentRating * currentCount + sanitizedData.staffRating) / newCount;

          transaction.update(staffRef, {
            rating: Number(newRating.toFixed(2)),
            reviewCount: newCount,
          });
        }
      }
    });

    return review;
  }

  /**
   * Get review by ID
   */
  async getReview(id: string): Promise<Review | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Review;
    }
    return null;
  }

  /**
   * Get salon reviews
   */
  async getSalonReviews(salonId: string, limitCount: number = 50): Promise<Review[]> {
    const q = query(
      collection(db, this.collectionName),
      where('salonId', '==', salonId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Review);
  }

  /**
   * Get staff reviews
   */
  async getStaffReviews(staffId: string, limitCount: number = 50): Promise<Review[]> {
    const q = query(
      collection(db, this.collectionName),
      where('staffId', '==', staffId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Review);
  }

  /**
   * Get user reviews
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Review);
  }

  /**
   * Check if user has reviewed
   */
  async hasUserReviewed(userId: string, salonId: string): Promise<boolean> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('salonId', '==', salonId),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /**
   * Add owner response to review
   */
  async addOwnerResponse(reviewId: string, response: string): Promise<void> {
    const sanitizedResponse = sanitizeInput(response);

    if (containsXSS(sanitizedResponse)) {
      throw new Error('Geçersiz karakter tespit edildi');
    }

    const reviewRef = doc(db, this.collectionName, reviewId);
    await updateDoc(reviewRef, {
      ownerResponse: sanitizedResponse,
    });
  }

  /**
   * Update review
   */
  async updateReview(reviewId: string, data: Partial<Review>): Promise<void> {
    const sanitizedData = sanitizeObject(data);

    if (sanitizedData.comment && containsXSS(sanitizedData.comment)) {
      throw new Error('Geçersiz karakter tespit edildi');
    }

    const reviewRef = doc(db, this.collectionName, reviewId);
    await updateDoc(reviewRef, sanitizedData);
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string): Promise<void> {
    const review = await this.getReview(reviewId);
    if (!review) {
      throw new Error('Yorum bulunamadı');
    }

    await runTransaction(db, async (transaction) => {
      // Delete review
      const reviewRef = doc(db, this.collectionName, reviewId);
      transaction.delete(reviewRef);

      // Update salon stats
      const salonRef = doc(db, 'salons', review.salonId);
      const salonDoc = await transaction.get(salonRef);
      
      if (salonDoc.exists()) {
        const currentStats = salonDoc.data().stats || { averageRating: 0, reviewCount: 0 };
        const newReviewCount = Math.max(0, currentStats.reviewCount - 1);
        
        let newAverageRating = 0;
        if (newReviewCount > 0) {
          newAverageRating = 
            (currentStats.averageRating * currentStats.reviewCount - review.rating) / newReviewCount;
        }

        transaction.update(salonRef, {
          'stats.averageRating': Number(newAverageRating.toFixed(2)),
          'stats.reviewCount': newReviewCount,
        });
      }

      // Update staff stats
      if (review.staffId) {
        const staffRef = doc(db, 'staff', review.staffId);
        const staffDoc = await transaction.get(staffRef);
        
        if (staffDoc.exists()) {
          const currentRating = staffDoc.data().rating || 0;
          const currentCount = staffDoc.data().reviewCount || 0;
          const newCount = Math.max(0, currentCount - 1);
          
          let newRating = 0;
          if (newCount > 0) {
            newRating = (currentRating * currentCount - review.staffRating) / newCount;
          }

          transaction.update(staffRef, {
            rating: Number(newRating.toFixed(2)),
            reviewCount: newCount,
          });
        }
      }
    });
  }

  /**
   * Get review statistics
   */
  async getReviewStats(salonId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const reviews = await this.getSalonReviews(salonId, 1000);

    const ratingDistribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalRating = 0;
    reviews.forEach(review => {
      totalRating += review.rating;
      ratingDistribution[Math.floor(review.rating)] = 
        (ratingDistribution[Math.floor(review.rating)] || 0) + 1;
    });

    return {
      averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }
}

export const reviewService = new ReviewService();
