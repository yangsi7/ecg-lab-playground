# ECG Lab Architecture Overview

## Application Structure

```mermaid
graph TD
    A[Frontend] --> B[Components]
    A --> C[Hooks]
    A --> D[Contexts]
    A --> E[Types]
    F[Backend] --> G[Supabase Functions]
    F --> H[TimescaleDB]
    
    B --> B1[Labs]
    B1 --> B11[ClinicLab]
    B1 --> B12[HolterLab]
    B1 --> B13[DataLab]
    B1 --> B14[PodLab]
    
    C --> C1[Data Fetching]
    C --> C2[State Management]
    C --> C3[UI Logic]
    
    G --> G1[Edge Functions]
    G1 --> G11[downsample-ecg]
    G1 --> G12[peak-preserving-downsample]
```

## Core Components

### Frontend

- **Component Layers**
  - `src/components/labs/`: Lab-specific views
  - `src/components/shared/`: Reusable UI elements
  - `src/context/`: Global state providers

- **Data Flow**
  1. User interaction triggers hook
  2. Hook calls Supabase RPC
  3. Response stored in Zustand store
  4. Components consume store updates

### Backend Services

- **Supabase Infrastructure**
  - Edge Functions: ECG processing endpoints
  - RPC: Database functions for analytics
  - Realtime: Study status updates

- **Database**
  - TimescaleDB hypertables for ECG data
  - Regular Postgres tables for metadata

## Type Definitions

All database entities typed in `src/types/database.types.ts`:

```typescript
interface ECGSample {
  time: string
  channel_1: number
  lead_on_p_1: boolean
  quality_1: boolean
  // ... other fields
}
```

## Key Dependencies

- **Frontend**
  - React/Next.js
  - TailwindCSS
  - Zustand
- **Backend**
  - Supabase
  - TimescaleDB
  - Deno (Edge Functions)
