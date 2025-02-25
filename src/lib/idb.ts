/**
 * src/lib/idb.ts
 * 
 * IndexedDB caching utility using Dexie
 * Provides a caching layer for clinic data to improve performance and offline capabilities
 */
import Dexie, { Table } from 'dexie';
import type { Clinic } from '@/types/domain/clinic';

// ExtendedClinic adds a timestamp for cache management
interface ExtendedClinic extends Clinic {
  lastUpdated: number; // timestamp
}

// Define the database schema
class ClinicCache extends Dexie {
  clinics!: Table<ExtendedClinic, string>; // string is the type of the primary key

  constructor() {
    super('ClinicCache');
    
    // Define tables and indices
    this.version(1).stores({
      clinics: 'id,name,vip_status,lastUpdated'
    });
  }
}

// Create the database instance
const db = new ClinicCache();

/**
 * Cache the clinics data in IndexedDB
 */
export async function cacheClinicData(clinics: Clinic[]): Promise<void> {
  const timestamp = Date.now();
  
  // Extend clinics with timestamp and store in transaction
  const extendedClinics = clinics.map(clinic => ({
    ...clinic,
    lastUpdated: timestamp
  }));
  
  try {
    await db.transaction('rw', db.clinics, async () => {
      // Clear old cache and add new data
      await db.clinics.bulkPut(extendedClinics);
    });
  } catch (error) {
    console.error('Failed to cache clinic data:', error);
  }
}

/**
 * Get cached clinic data with optional expiration check
 */
export async function getCachedClinicData(maxAge?: number): Promise<Clinic[] | null> {
  try {
    // Get all clinics
    const clinics = await db.clinics.toArray();
    
    // Return null if no data
    if (!clinics.length) return null;
    
    // If maxAge is provided, check if cache is still valid
    if (maxAge) {
      const oldestAllowed = Date.now() - maxAge;
      const isExpired = clinics.some(clinic => clinic.lastUpdated < oldestAllowed);
      
      if (isExpired) return null;
    }
    
    // Strip the lastUpdated field before returning
    return clinics.map(({ lastUpdated, ...clinic }) => clinic);
  } catch (error) {
    console.error('Failed to get cached clinic data:', error);
    return null;
  }
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  try {
    await db.clinics.clear();
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

export default db; 