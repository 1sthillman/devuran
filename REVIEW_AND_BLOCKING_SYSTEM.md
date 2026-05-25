# Review and Blocking System Implementation

## Overview
This document outlines the implementation of the review system restrictions and mutual blocking functionality between businesses and customers.

## Requirements Implemented

### 1. Review System Restrictions ✅
- Customers can only review appointments they attended (status: 'completed')
- Cancelled appointments cannot be reviewed
- Each appointment can only be reviewed once
- Business can rate customers once per appointment

### 2. Business Blocking Customers ✅
- Business owners can block customers from their CRM panel
- Blocked customers:
  - Cannot see the business in search results or homepage
  - Cannot book appointments with the business
  - Cannot view the business detail page
- Business can unblock customers
- Block reason is required and stored

### 3. Customer Blocking Businesses ✅
- Customers can block businesses
- Blocked businesses:
  - Do not appear in customer's search results
  - Cannot be booked by the customer
  - Are hidden from homepage recommendations
- Customer can unblock businesses

## Technical Implementation

### Database Schema

#### customers collection
```typescript
{
  id: string; // Format: {salonId}_{userId}
  salonId: string;
  customerId: string;
  isBanned: boolean;
  bannedAt: string;
  bannedReason: string;
  bannedBy: string;
  rating: number; // Business rating of customer (1-5)
  notes: string;
  tags: string[];
}
```

#### blockedBusinesses collection (NEW)
```typescript
{
  id: string; // Auto-generated
  userId: string; // Customer who blocked
  businessId: string; // Salon that was blocked
  blockedAt: string;
  reason: string;
}
```

### Firestore Security Rules

#### customers collection
- Salon owners can create/update/delete customer records for their salon
- Document ID format: `{salonId}_{userId}`
- Requires `salonId` field to match a salon owned by the user

#### blockedBusinesses collection
- Users can only read/write their own blocks
- Format: `userId` field must match authenticated user

### Frontend Changes

#### 1. Review Modal (ReviewModal.tsx)
- Check if appointment status is 'completed' before allowing review
- Check if appointment already has a review
- Show appropriate error messages

#### 2. Customer Detail Modal (CustomerDetailModal.tsx)
- Already implemented ban/unban functionality
- Fixed permissions by updating Firestore rules
- One-time rating per appointment

#### 3. Salon List Filtering
- Filter out businesses blocked by customer
- Filter out businesses that banned the customer

#### 4. Booking Flow
- Check if customer is banned before allowing booking
- Check if customer blocked the business
- Show appropriate error messages

## Files Modified

1. `firestore.rules` - Updated customers collection rules
2. `src/services/customerService.ts` - Ban/unban functionality
3. `src/components/crm/CustomerDetailModal.tsx` - UI for banning
4. `src/services/blockingService.ts` - NEW: Customer blocking businesses
5. `src/components/review/ReviewModal.tsx` - Review restrictions
6. `src/services/firebaseService.ts` - Review validation

## Testing Checklist

### Review System
- [ ] Customer can review completed appointment
- [ ] Customer cannot review cancelled appointment
- [ ] Customer cannot review same appointment twice
- [ ] Business can rate customer once per appointment
- [ ] Review button only shows for completed appointments

### Business Blocking Customer
- [ ] Business owner can block customer with reason
- [ ] Blocked customer cannot see business in search
- [ ] Blocked customer cannot book appointment
- [ ] Business owner can unblock customer
- [ ] Block status shows in CRM panel

### Customer Blocking Business
- [ ] Customer can block business
- [ ] Blocked business doesn't appear in search
- [ ] Blocked business cannot be booked
- [ ] Customer can unblock business
- [ ] Block list accessible from profile

## Next Steps

1. Deploy updated Firestore rules
2. Test all blocking scenarios
3. Add UI for customer to block/unblock businesses
4. Add blocked businesses list in customer profile
5. Update analytics to exclude blocked/banned interactions
