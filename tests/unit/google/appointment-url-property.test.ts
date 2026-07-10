/**
 * Property Test: Unique Appointment URL Generation
 * 
 * Property 7: Different location IDs must generate unique URLs
 */

import { fc, test } from '@fast-check/jest';
import { appointmentUrlGenerator } from '@/services/google/appointment-url-generator';

describe('Property 7: Unique Appointment URL Generation', () => {
  /**
   * Property: For any two different location IDs, generated URLs must be unique
   * 
   * This test validates Requirement 2.5 and 3.1:
   * - Each location gets a unique appointment URL
   * - No URL collisions occur
   */
  test.prop([
    fc.tuple(
      // Generate pairs of different location data
      fc.record({
        businessId: fc.hexaString({ minLength: 10, maxLength: 20 }),
        locationId: fc.hexaString({ minLength: 10, maxLength: 20 }),
        businessName: fc.string({ minLength: 5, maxLength: 50 }),
        locationName: fc.string({ minLength: 5, maxLength: 50 }),
      }),
      fc.record({
        businessId: fc.hexaString({ minLength: 10, maxLength: 20 }),
        locationId: fc.hexaString({ minLength: 10, maxLength: 20 }),
        businessName: fc.string({ minLength: 5, maxLength: 50 }),
        locationName: fc.string({ minLength: 5, maxLength: 50 }),
      })
    ).filter(([loc1, loc2]) => loc1.locationId !== loc2.locationId), // Ensure different location IDs
  ])(
    'should generate unique URLs for different locations',
    async ([location1, location2]) => {
      // Generate URLs for both locations
      const url1 = await appointmentUrlGenerator.generateAppointmentUrl(
        location1.businessId,
        location1.locationId,
        location1.businessName,
        location1.locationName
      );

      const url2 = await appointmentUrlGenerator.generateAppointmentUrl(
        location2.businessId,
        location2.locationId,
        location2.businessName,
        location2.locationName
      );

      // URLs must be different
      expect(url1).not.toBe(url2);

      // URLs must be valid
      expect(url1).toMatch(/^https?:\/\/.+\/book\/.+/);
      expect(url2).toMatch(/^https?:\/\/.+\/book\/.+/);

      // Cleanup (delete URL mappings)
      await appointmentUrlGenerator.deleteAppointmentUrl(location1.locationId);
      await appointmentUrlGenerator.deleteAppointmentUrl(location2.locationId);
    },
    { numRuns: 100 } // Run 100 random test cases
  );

  /**
   * Property: URL generation is idempotent for the same location
   * 
   * Getting URL for same location multiple times should return same URL
   */
  test.prop([
    fc.record({
      businessId: fc.hexaString({ minLength: 10, maxLength: 20 }),
      locationId: fc.hexaString({ minLength: 10, maxLength: 20 }),
      businessName: fc.string({ minLength: 5, maxLength: 50 }),
      locationName: fc.string({ minLength: 5, maxLength: 50 }),
    }),
  ])(
    'should return same URL for same location (idempotent)',
    async (location) => {
      // Generate URL first time
      const url1 = await appointmentUrlGenerator.generateAppointmentUrl(
        location.businessId,
        location.locationId,
        location.businessName,
        location.locationName
      );

      // Get URL second time (should use existing)
      const url2 = await appointmentUrlGenerator.getAppointmentUrl(location.locationId);

      // URLs must match
      expect(url1).toBe(url2);

      // Cleanup
      await appointmentUrlGenerator.deleteAppointmentUrl(location.locationId);
    },
    { numRuns: 50 }
  );

  /**
   * Property: URL format consistency
   * 
   * All generated URLs must follow the format: {BASE_URL}/book/{business-slug}/{location-slug}
   */
  test.prop([
    fc.record({
      businessId: fc.hexaString({ minLength: 10, maxLength: 20 }),
      locationId: fc.hexaString({ minLength: 10, maxLength: 20 }),
      businessName: fc.string({ minLength: 5, maxLength: 50 }),
      locationName: fc.string({ minLength: 5, maxLength: 50 }),
    }),
  ])(
    'should follow consistent URL format',
    async (location) => {
      const url = await appointmentUrlGenerator.generateAppointmentUrl(
        location.businessId,
        location.locationId,
        location.businessName,
        location.locationName
      );

      // Check URL format
      expect(url).toMatch(/^https?:\/\/.+\/book\/[a-z0-9-]+\/[a-z0-9-]+(-[a-f0-9]{8})?$/);

      // Check slug format (lowercase, alphanumeric, hyphens only)
      const urlPath = url.split('/book/')[1];
      const parts = urlPath.split('/');
      
      expect(parts[0]).toMatch(/^[a-z0-9-]+$/); // business slug
      expect(parts[1]).toMatch(/^[a-z0-9-]+(-[a-f0-9]{8})?$/); // location slug (+ optional unique ID)

      // Cleanup
      await appointmentUrlGenerator.deleteAppointmentUrl(location.locationId);
    },
    { numRuns: 50 }
  );

  /**
   * Property: URL resolution round-trip
   * 
   * URL generated for a location should resolve back to same business and location IDs
   */
  test.prop([
    fc.record({
      businessId: fc.hexaString({ minLength: 10, maxLength: 20 }),
      locationId: fc.hexaString({ minLength: 10, maxLength: 20 }),
      businessName: fc.string({ minLength: 5, maxLength: 50 }),
      locationName: fc.string({ minLength: 5, maxLength: 50 }),
    }),
  ])(
    'should resolve URL back to original business and location',
    async (location) => {
      // Generate URL
      const url = await appointmentUrlGenerator.generateAppointmentUrl(
        location.businessId,
        location.locationId,
        location.businessName,
        location.locationName
      );

      // Extract path from URL
      const urlPath = '/' + url.split('/').slice(3).join('/');

      // Resolve URL
      const resolved = await appointmentUrlGenerator.resolveUrl(urlPath);

      // Should resolve to original IDs
      expect(resolved).not.toBeNull();
      expect(resolved?.businessId).toBe(location.businessId);
      expect(resolved?.locationId).toBe(location.locationId);

      // Cleanup
      await appointmentUrlGenerator.deleteAppointmentUrl(location.locationId);
    },
    { numRuns: 50 }
  );
});
