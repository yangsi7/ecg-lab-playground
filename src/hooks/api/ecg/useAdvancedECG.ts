import { useECG } from './useECG';
import { useECGCanvas } from './useECGCanvas';
import type { ECGData } from '@/types/domain/ecg';

interface UseAdvancedECGParams {
    pod_id: string;
    time_start: string;
    time_end: string;
    channel: 1 | 2 | 3;
    width?: number;
    height?: number;
    defaultYMin?: number;
    defaultYMax?: number;
    colorBlindMode?: boolean;
    factor?: number;
    // Synchronization props
    sharedScaleX?: number;
    sharedTranslateX?: number;
    onScaleChange?: (scale: number) => void;
    onTranslateChange?: (translate: number) => void;
    syncEnabled?: boolean;
}

export function useAdvancedECG({
    pod_id,
    time_start,
    time_end,
    channel,
    width = 800,
    height = 250,
    defaultYMin = -50,
    defaultYMax = 50,
    colorBlindMode = false,
    factor = 4,
    // Synchronization props
    sharedScaleX,
    sharedTranslateX,
    onScaleChange,
    onTranslateChange,
    syncEnabled = false
}: UseAdvancedECGParams) {
    // Fetch ECG data using the new hook
    const {
        samples,
        chunks,
        isLoading,
        error,
        refetch
    } = useECG({
        pod_id,
        time_start,
        time_end,
        factor,
        enabled: true
    });

    // Transform samples to ECGData format
    const ecgData: ECGData[] = samples.map(sample => ({
        sample_time: sample.time,
        downsampled_channel_1: sample.channels[0],
        downsampled_channel_2: sample.channels[1],
        downsampled_channel_3: sample.channels[2],
        lead_on_p_1: sample.lead_on_p[0],
        lead_on_p_2: sample.lead_on_p[1],
        lead_on_p_3: sample.lead_on_p[2],
        lead_on_n_1: sample.lead_on_n[0],
        lead_on_n_2: sample.lead_on_n[1],
        lead_on_n_3: sample.lead_on_n[2],
        quality_1: sample.quality[0],
        quality_2: sample.quality[1],
        quality_3: sample.quality[2]
    }));

    // Use canvas hook for rendering
    const canvasProps = useECGCanvas({
        data: ecgData,
        channel,
        width,
        height,
        defaultYMin,
        defaultYMax,
        colorBlindMode,
        // Pass synchronization props
        sharedScaleX,
        sharedTranslateX,
        onScaleChange,
        onTranslateChange,
        syncEnabled
    });

    return {
        ...canvasProps,
        data: ecgData,
        isLoading,
        error,
        refetch,
        chunks
    };
}
