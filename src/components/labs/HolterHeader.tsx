import React from 'react';
import { StatusPill } from './StatusPill';
// etc.

interface HolterHeaderProps {
  studyId: string;
  podId: string;
  patientId: string; // "XXX-XX-1234"
  clinicName: string;
  status: 'active'|'interrupted'|'error'|'completed'; 
  interruptions: number;
  sixHourVariance: number;
}

export function HolterHeader(props: HolterHeaderProps) {
  const { studyId, podId, patientId, clinicName, status, interruptions, sixHourVariance } = props;

  return (
    <div className="flex flex-col sm:flex-row p-4 gap-4 bg-white/5 rounded-md">
      <div className="flex-1 space-y-2">
        <h1 className="text-xl text-white font-semibold">Study: {studyId}</h1>
        <p className="text-sm text-gray-200">POD ID: {podId}</p>
        <p className="text-sm text-gray-200">Patient: {patientId}</p>
        <p className="text-sm text-gray-200">Clinic: {clinicName}</p>
      </div>
      <div className="flex flex-col items-start sm:items-end justify-center gap-2">
        <StatusPill status={status} />
        <p className="text-sm text-gray-300">
          Interruptions: <span className="font-medium">{interruptions}</span>
        </p>
        <p className="text-sm text-gray-300">
          6h Variance: <span className="font-medium">{sixHourVariance.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}
