import type { Json } from '@/types/database.types';

export interface DataSet {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    created_by: string | null;
    metadata: Json | null;
    updated_at: string;
    status: string | null;
    size_bytes: number | null;
    file_count: number | null;
} 