import { create } from 'zustand';

interface DiagnosticsState {
  metrics: {
    qualityFractionVariability: number;
    totalMinuteVariability: number;
    interruptions: number;
    badHours: number;
  } | null;
  setMetrics: (metrics: DiagnosticsState['metrics']) => void;
}

export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  metrics: null,
  setMetrics: (metrics) => set({ metrics }),
}));