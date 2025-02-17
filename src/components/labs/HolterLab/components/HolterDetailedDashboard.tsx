/********************************************************************
 * FILE: src/components/labs/HolterDetailDashboard.tsx
 *
 * - High-level container for the Holter detail.
 * - Demonstrates usage of aggregator/histogram + 
 *   possibility of an "Open ECG" modal with a chosen time.
 ********************************************************************/
import React, { useState } from 'react';
import { ECGViewerModal } from './ECGViewerModal';
import { useHolterData } from '../../hooks/useHolterData';
import { HolterHistogram24h } from './HolterHistogram24h';
import { CalendarSelectorPodDays } from './CalendarSelectorPodDays';

interface HolterDetailDashboardProps {
    studyId: string;
}

export function HolterDetailDashboard({ studyId }: HolterDetailDashboardProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [showECG, setShowECG] = useState(false);

    // Example: fetch top-level info
    const { loading, error, study } = useHolterData({ studyId });

    // Example aggregator data fetch for day-based histogram
    const histogramData: any[] = []; // placeholder; fetch or compute in real code

    function handleDaySelect(day: Date) {
        setSelectedDate(day);
        // fetch aggregator => setHistogramData(...)
    }

    function handleHourSelect(hr: number) {
        setSelectedHour(hr);
        // Possibly auto open ECG
    }

    function openECG() {
        setShowECG(true);
    }

    if (loading) {
        return <p className="text-gray-300">Loading study data...</p>;
    }
    if (error) {
        return <p className="text-red-400">{error}</p>;
    }

    return (
        <div className="space-y-4">
            {/* Some header or summary if we have "study" */}
            {study && (
                <div className="bg-white/10 p-3 rounded border border-white/20 text-white">
                    <h2 className="text-lg font-semibold">Holter Study: {studyId}</h2>
                    <p className="text-sm text-gray-300">Pod: {study.pod_id}</p>
                </div>
            )}

            <CalendarSelectorPodDays
                availableDays={[]} 
                onSelectDay={handleDaySelect}
            />

            <HolterHistogram24h
                data={histogramData}
                onHourSelect={handleHourSelect}
            />

            {/* For demonstration: user picks hour => can open ECG */}
            {selectedDate && selectedHour !== null && (
                <button
                    onClick={openECG}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    View ECG for {selectedDate.toDateString()} {selectedHour}:00
                </button>
            )}

            {/* Modal usage: pass timeStart/timeEnd as needed.
                For example, we might do:
                timeStart = new Date(selectedDate).setHours(selectedHour,0,0)
                timeEnd   = new Date(selectedDate).setHours(selectedHour,59,59)
            */}
            {showECG && study && (
                <ECGViewerModal
                    isOpen={showECG}
                    onClose={() => setShowECG(false)}
                    podId={study.pod_id}
                    timeStart={selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedHour || 0).toISOString() : ''}
                    timeEnd={selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), (selectedHour || 0) + 1).toISOString() : ''}
                />
            )}
        </div>
    );
}
