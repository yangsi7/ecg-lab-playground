/********************************************************************
 * FILE: src/components/labs/HolterDetail.tsx
 * 
 * Another version that uses aggregator or fetches data, 
 * then can open an aggregator-based "ECGViewer" or
 * the new "ECGViewerModal" if desired.
 ********************************************************************/
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHolterData } from '../../hooks/useHolterData';
import { ECGViewer } from './ECGViewer';

export default function HolterDetail() {
    const { studyId } = useParams<{ studyId: string }>();
    const navigate = useNavigate();
    const { study, readings, loading, error } = useHolterData({ studyId });
    const [showAggregatorView, setShowAggregatorView] = useState(false);

    if (!studyId) {
        return <div className="text-red-400">No studyId param</div>;
    }
    if (loading) return <p className="text-gray-300">Loading Holter data...</p>;
    if (error) return <p className="text-red-300">{error}</p>;
    if (!study) return <p className="text-gray-300">Study not found.</p>;

    return (
        <div className="space-y-4 text-white">
            <button onClick={() => navigate(-1)} className="px-3 py-1 bg-white/10 rounded hover:bg-white/20">
                Back
            </button>
            <h2 className="text-xl font-semibold">HolterDetail for {studyId}</h2>
            <p className="text-sm text-gray-300">Pod: {study.pod_id}</p>

            {/* aggregator-based subwindow approach */}
            <button
                onClick={() => setShowAggregatorView(!showAggregatorView)}
                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30"
            >
                Toggle Aggregator-based ECGViewer
            </button>

            {showAggregatorView && (
                <div className="mt-4 bg-white/10 rounded p-4 border border-white/20">
                    <ECGViewer
                        study={{
                            pod_id: study.pod_id,
                            start_timestamp: study.start_timestamp,
                            end_timestamp: study.end_timestamp || new Date().toISOString()
                        }}
                        onClose={() => setShowAggregatorView(false)}
                    />
                </div>
            )}
        </div>
    );
}
