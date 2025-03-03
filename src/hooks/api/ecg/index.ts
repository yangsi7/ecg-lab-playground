/**
 * ECG hooks index file
 * Exports all ECG-related hooks for convenient importing
 */

export * from './useECGCanvas';
export * from './useECG';
export * from './useECGAggregates';

export { useAdvancedECG } from './useAdvancedECG';
export { useECGAggregatorView } from './useECGAggregatorView';
export { useECGTimeline } from './useECGTimeline';

export type { TimeInterval } from '@/types/domain/ecg';
export type { UseECGAggregatorViewParams, UseECGAggregatorViewResult } from './useECGAggregatorView';
export type { UseECGCanvasParams, UseECGCanvasResult } from './useECGCanvas';
export type { UseECGTimelineParams, UseECGTimelineResult } from './useECGTimeline';
