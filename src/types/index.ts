/**
 * Type definitions for the application
 * Re-exports database types, domain types, and type utilities
 */

// Database types
export type { Database } from './database.types';

// Domain types
export type { Study, StudyReading } from './domain/study';
export { isStudy, toStudy, toStudyReading } from './domain/study';

export type { ECGData, ECGQueryOptions } from './domain/ecg';
export { toECGData } from './domain/ecg';

export type { Clinic } from './domain/clinic';
export { isClinic, toClinic } from './domain/clinic';

export type { HolterStudy } from './domain/holter';
export { isHolterStudy, toHolterStudy } from './domain/holter';

// Type utilities and helpers
export * from './utils';
