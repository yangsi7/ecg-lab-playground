export interface DataSet {
    id: string;
    name: string;
    type: 'ecg' | 'activity' | 'sleep';
    size: number;
    status: 'processing' | 'ready' | 'error';
    created_at: string;
    updated_at: string;
    metadata?: Record<string, unknown>;
} 