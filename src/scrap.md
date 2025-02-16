Review the current implementation of the entire ECG viewer flow based on the initial requirements and current relevant code below. Streamline the implementation, dicarding files, hooks or componentns we don't need and updating/creating the files that are needed to achieve a fully featured production ready, customer-facing worthy high-end ECG-viewer.

<initial_requirements>
Initial ECG Viewer Flow Requirements:
```
1. **StudyContextLoader**  
   - Parses `study_id` from the query string.  
   - Fetches the study record (`pod_id`, `earliest_time`, `latest_time`).  
   - Use `pod_id`get_pod_earliest_latest to set the default selected date to the last date with data (i.e., the day portion of `latestTime`).

2. **CalendarSelector**  
   - Renders a day picker from `earliest_time` to `latest_time`.  
   - get_pod_days() to retrieve days with available data--> only these days are selectable
   - Default to latest day with data--> updates local state → triggers a fetch for the DailyOverviewBar data aggregator.  

3. **DailyOverviewBar (24h)**  
   - Uses an aggregator to query aggregated lead/quality data in 24 segments for the selected day.  
   - Displays these segments as a horizontal bar with 24 clickable slices.  
   - On user click or drag, defines the 1-hour subwindow in local state.  
   - The default hour subwindow is set to the last aggregator slice in the day that has data.
Daily Aggregation is done with:
SELECT * FROM aggregate_leads(
  '09753cf8-f1c5-4c80-b310-21d5fcb85401'::uuid,
  '2024-07-25T00:00:00Z',
  '2024-07-27T23:59:59Z',
  3600
);

Which returns
```
| time_bucket            | lead_on_p_1       | lead_on_p_2       | lead_on_p_3       | lead_on_n_1       | lead_on_n_2       | lead_on_n_3       | quality_1_percent | quality_2_percent | quality_3_percent |
| ---------------------- | ----------------- | ----------------- | ----------------- | ----------------- | ----------------- | ----------------- | ----------------- | ----------------- | ----------------- |
| 2024-07-25 22:00:00+00 | 0.137201313004381 | 0.134151014616013 | 0.134151014616013 | 0.105536310687034 | 0.134724378974729 | 0.105582179835731 | 0.626113879717714 | 11.2821860471783  | 3.44171512391837  |
| 2024-07-25 23:00:00+00 | 1                 | 1                 | 1                 | 0.913458333333333 | 1                 | 0.913458333333333 | 4.30789930555556  | 21.5544270833333  | 4.24331597222222  |
| 2024-07-26 00:00:00+00 | 1                 | 1                 | 1                 | 1                 | 1                 | 1                 | 0                 | 0                 | 0                 |
```


4. **HourlySubwindowBar (1h)**  
   - Displays a more granular bar (e.g., 1-min slices) for the selected hour.  
   - On user drag, defines a smaller subwindow (e.g., 12 minutes).  
   - The default subwindow is the last 4 minutes of the selected hour that has data.
Would also be done using aggregate_leads()


5. **Downsampling Data Fetch**  
   - A dedicated hook `useDownsampleECG.ts` calls the Edge Function with `pod_id`, `time_start`, `time_end`, and optionally `max_pts`.  
   - Receives a JSON array of downsampled points for the final subwindow.  
   - This happens once the subwindow is finalized.

Downsample data fetch uses edgefunction:
```
curl -L -X POST 'https://mzmltngdorhshxyguwgj.supabase.co/functions/v1/downsample-ecg'   -H "Content-Type: application/json"   -H "Authorization: Bearer <token>"   -d '{
    "pod_id": "09753cf8-f1c5-4c80-b310-21d5fcb85401",
    "time_start": "2024-07-25T14:45:00Z",
    "time_end": "2024-07-27T14:49:00Z",
    "max_pts": 2000
  }'
```
Response schema:
```
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "sample_time": {
        "type": "string",
        "format": "date-time",
        "description": "Timestamp of the sample"
      },
      "downsampled_channel_1": {
        "type": "number",
        "description": "Numeric value for channel 1"
      },
      "downsampled_channel_2": {
        "type": "number",
        "description": "Numeric value for channel 2"
      },
      "downsampled_channel_3": {
        "type": "number",
        "description": "Numeric value for channel 3"
      },
      "lead_on_p_1": {
        "type": "boolean"
      },
      "lead_on_p_2": {
        "type": "boolean"
      },
      "lead_on_p_3": {
        "type": "boolean"
      },
      "lead_on_n_1": {
        "type": "boolean"
      },
      "lead_on_n_2": {
        "type": "boolean"
      },
      "lead_on_n_3": {
        "type": "boolean"
      },
```


6. **MainECGViewer**  
   - Plots the returned ECG data in three stacked waveforms (sampled at ~80/160 Hz).  
   - Overlays or appends a small bar to indicate `lead_on` and quality flags (see item #7).  
   - Supports zoom toggles (e.g., 12-min → 4-min).  
     - Optionally re-fetches data at higher resolution or re-slices the local data if enough resolution is already loaded.  
   - Implements color-coded waveforms and ensures errors/spinners are cleared to avoid “stuck” UI states.

7. **Lead On/Off & Quality Visualization**  
   - For each data point, checks `lead_on_x` and `quality_x`.  
   - If `lead_on_x = true`, render that segment; if `quality_x = true`, mark it red, else green.

8. **Loader States and Errors**  
   - Spinners appear only while each fetch is in progress.  
   - They disappear as soon as data or an error is returned.  
   - If no data is found, display “No data” or an error message instead of leaving a loader.

9. **Logging**  
   - `logger.debug` and `logger.info` calls are inserted in aggregator and downsample hooks to track each request and response.

```
</initial_requirements>


<relevant_existing_components_and_hooks>

```// src/components/labs/ECGViewer.tsx

interface ECGViewerProps {
  study: {
    pod_id: string
    start_timestamp: string
    end_timestamp: string
  }
  onClose: () => void
}

export function ECGViewer({ study, onClose }: ECGViewerProps) {
  return (
    <div className="border border-white/20 p-4 text-white rounded-md relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 px-2 py-1 bg-white/10 rounded text-sm hover:bg-white/20"
      >
        Close
      </button>
      <h3 className="text-lg">ECG Viewer</h3>
      <p className="mt-2 text-gray-300 text-sm">Pod ID: {study.pod_id}</p>
      <p className="text-gray-300 text-sm">Start: {study.start_timestamp}</p>
      <p className="text-gray-300 text-sm">End: {study.end_timestamp}</p>
    </div>
  )
}
```
```import { useECGAggregates } from '../../hooks/useECGAggregates'
import { HourlySubwindowBar } from './HourlySubwindowBar'

type HourlyECGAggregatorProps = {
  podId: string
  day: Date
  hour: number
  onSubwindowFinal: (startIso: string, endIso: string) => void
}


export function HourlyECGAggregator({ 
  podId, 
  day, 
  hour, 
  onSubwindowFinal 
}: HourlyECGAggregatorProps) {
  const hourStart = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0))
  const hourEnd = new Date(hourStart.getTime() + 3599999)
  const { data, loading, error } = useECGAggregates({
    podId,
    startTime: hourStart.toISOString(),
    endTime: hourEnd.toISOString(),
    bucketSize: 60
  })

  if (loading) {
    return <div className="text-sm text-gray-400">Loading 1-min aggregator...</div>
  }
  if (error) {
    return <div className="text-sm text-red-300">{error}</div>
  }
  if (!data.length) {
    return <div className="text-sm text-gray-400">No aggregator data for {hour}:00–{hour + 1}:00</div>
  }

  return (
    <HourlySubwindowBar
      data={data}
      hourStartISO={hourStart.toISOString()}
      onSelectSubwindow={(startIso: string, endIso: string) => onSubwindowFinal(startIso, endIso)}
      defaultMinutes={12}
    />
  )
}```


```/* =========================================
   src/components/labs/HourlySubwindowBar.tsx
   (Phase 3: improved design & transitions)
   ========================================= */
   import { AggregatedLeadData } from '../../hooks/useECGAggregates'
   import { useState, useEffect } from 'react'
   
   type HourlySubwindowBarProps = {
     data: AggregatedLeadData[]
     onSelectSubwindow: (startIso: string, endIso: string) => void
     hourStartISO: string
     defaultMinutes?: number
   }
   
   export function HourlySubwindowBar({
     data,
     onSelectSubwindow,
     hourStartISO,
     defaultMinutes = 12
   }: HourlySubwindowBarProps) {
     const [dragStart, setDragStart] = useState<number | null>(null)
     const [dragEnd, setDragEnd] = useState<number | null>(null)
   
     useEffect(() => {
       if (!data.length) return
       if (dragStart === null && dragEnd === null) {
         let lastNonEmpty = 0
         data.forEach((slice, idx) => {
           const avg = ((slice.quality_1_percent||0)+(slice.quality_2_percent||0)+(slice.quality_3_percent||0))/3
           if (avg>0) lastNonEmpty=idx
         })
         let startM = Math.max(0, lastNonEmpty - (defaultMinutes-1))
         let endM = lastNonEmpty
         const baseTime = new Date(hourStartISO).getTime()
         const sMs = baseTime + startM*60000
         const eMs = baseTime + (endM+1)*60000
         onSelectSubwindow(new Date(sMs).toISOString(), new Date(eMs).toISOString())
       }
     }, [data])
   
     const finalizeDrag = () => {
       if (dragStart !== null && dragEnd !== null) {
         const s = Math.min(dragStart, dragEnd)
         const e = Math.max(dragStart, dragEnd)
         const baseTime = new Date(hourStartISO).getTime()
         const startMs = baseTime + s*60000
         const endMs = baseTime + (e+1)*60000
         onSelectSubwindow(new Date(startMs).toISOString(), new Date(endMs).toISOString())
       }
       setDragStart(null)
       setDragEnd(null)
     }
   
     useEffect(() => {
       const mouseUpHandler = () => finalizeDrag()
       window.addEventListener('mouseup', mouseUpHandler)
       return () => {
         window.removeEventListener('mouseup', mouseUpHandler)
       }
     }, [dragStart, dragEnd])
   
     return (
       <div className="flex gap-1 p-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg transition
                       ring-1 ring-transparent hover:ring-sky-500/50 min-w-[640px] overflow-hidden">
         {data.map((slice, idx) => {
           const avgQ = ((slice.quality_1_percent||0) + (slice.quality_2_percent||0) + (slice.quality_3_percent||0))/3
           let color = 'bg-red-500/40'
           if (avgQ >= 80) color = 'bg-green-400/50'
           else if (avgQ >= 50) color = 'bg-yellow-400/50'
           const isSelected = dragStart !== null && dragEnd !== null && idx>=Math.min(dragStart,dragEnd) && idx<=Math.max(dragStart,dragEnd)
           return (
             <div
               key={idx}
               className={`
                 flex-1 h-8 rounded transition-transform duration-200 cursor-pointer 
                 ${color}
                 ${isSelected ? 'scale-105 ring ring-blue-400' : 'hover:scale-110'}
               `}
               onMouseDown={() => {
                 setDragStart(idx)
                 setDragEnd(idx)
               }}
               onMouseEnter={() => {
                 if (dragStart !== null) setDragEnd(idx)
               }}
             />
           )
         })}
       </div>
     )
   }
   ```

```/*
==========================================================
FILE: src/components/labs/ECGViewerPage.tsx
- Same fix: import { HourlyECGAggregator } 
- Provide types for function parameters 
==========================================================
*/

// src/components/labs/ECGViewerPage.tsx
import { useParams } from 'react-router-dom'
import { ArrowLeftCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ECGViewerPage() {
  const { studyId } = useParams()
  const navigate = useNavigate()
  return (
    <div className="text-white">
      <button onClick={() => navigate(-1)}>
        <ArrowLeftCircle className="h-5 w-5" />
      </button>
      <h2 className="text-xl">ECG Viewer Page for Study {studyId}</h2>
    </div>
  )
}

export default ECGViewerPage
```

```// src/components/labs/ECGTimelineBar.tsx

import { useRef, useEffect, useState, useMemo } from 'react';
import { AggregatedLeadData } from '../../hooks/useECGAggregates';
import { useDebouncedCallback } from '../../hooks/useDebounce';

interface ECGTimelineBarProps {
  data: AggregatedLeadData[];
  width?: number;
  height?: number;
  onSelectRange?: (startIdx: number, endIdx: number) => void;
  selectedRange?: [number, number] | null;
}

export function ECGTimelineBar({
  data,
  width = 600,
  height = 30,
  onSelectRange,
  selectedRange
}: ECGTimelineBarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  const debouncedSelect = useDebouncedCallback((s: number, e: number) => {
    onSelectRange?.(s, e);
  }, 150);

  const barColors = useMemo(() => {
    return data.map((chunk) => {
      const q1 = chunk.quality_1_percent ?? 0;
      const q2 = chunk.quality_2_percent ?? 0;
      const q3 = chunk.quality_3_percent ?? 0;
      const avgQ = (q1 + q2 + q3) / 3;
      if (avgQ >= 80) return '#4ade80'; // green
      if (avgQ >= 50) return '#f59e0b'; // orange
      return '#ef4444';               // red
    });
  }, [data]);

  const drawBar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!data.length) {
      ctx.fillStyle = '#666';
      ctx.fillText('No aggregator data', 10, height / 2);
      return;
    }

    data.forEach((_, idx) => {
      const x = (idx / data.length) * width;
      const segWidth = width / data.length;
      ctx.fillStyle = barColors[idx];
      ctx.fillRect(x, 0, segWidth, height);
    });

    // selected range highlight
    if (selectedRange) {
      const [s, e] = selectedRange;
      const startX = (s / data.length) * width;
      const endX = (e / data.length) * width;
      ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.fillRect(startX, 0, endX - startX, height);
    }

    // drag highlight
    if (dragStart !== null && dragEnd !== null) {
      const x1 = Math.min(dragStart, dragEnd);
      const x2 = Math.max(dragStart, dragEnd);
      ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.fillRect(x1, 0, x2 - x1, height);
    }
  };

  useEffect(() => {
    drawBar();
  }, [data, barColors, dragStart, dragEnd, selectedRange, width, height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDragStart(x);
    setDragEnd(x);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart === null) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDragEnd(x);
  };

  const handleMouseUpOrLeave = () => {
    if (dragStart !== null && dragEnd !== null) {
      const s = Math.min(dragStart, dragEnd);
      const e = Math.max(dragStart, dragEnd);
      const startIdx = Math.floor((s / width) * data.length);
      const endIdx = Math.floor((e / width) * data.length);
      debouncedSelect(startIdx, endIdx);
    }
    setDragStart(null);
    setDragEnd(null);
  };

  return (
    <div style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ background: '#111', cursor: 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      />
    </div>
  );
}```

```/*
==========================================================
FILE: src/components/labs/ECGPlot.tsx
(Ensure we export 'ECGPlot' so that MainECGViewer can import it)
==========================================================
*/
import { useRef, useEffect } from 'react'
import type { DownsamplePoint } from '../../hooks/useDownsampleECG'

type ECGPlotProps = {
  data: DownsamplePoint[]
  channel: 1|2|3
  label: string
  width?: number
  height?: number
}

export function ECGPlot({
  data,
  channel,
  label,
  width = 800,
  height = 160
}: ECGPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    if (data.length < 2) {
      ctx.fillStyle = 'gray'
      ctx.fillText('No data', 10, height / 2)
      return
    }
    const t0 = new Date(data[0].sample_time).getTime()
    const t1 = new Date(data[data.length - 1].sample_time).getTime()
    const totalMs = t1 - t0 || 1
    const yMid = height / 2
    const amplitude = 2000
    const yScale = yMid / amplitude

    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#ddd'
    ctx.fillText(label, 8, 12)
    ctx.lineWidth = 1.5

    ctx.beginPath()
    for (let i=0; i<data.length; i++){
      const pt = data[i]
      const ms = new Date(pt.sample_time).getTime() - t0
      const x = (ms / totalMs) * width

      let val = 0
      let leadOnP = false
      let leadOnN = false
      let qualityBad = false
      if (channel===1){
        val = pt.downsampled_channel_1
        leadOnP = pt.lead_on_p_1
        leadOnN = pt.lead_on_n_1
        qualityBad = pt.quality_1
      } else if (channel===2){
        val = pt.downsampled_channel_2
        leadOnP = pt.lead_on_p_2
        leadOnN = pt.lead_on_n_2
        qualityBad = pt.quality_2
      } else {
        val = pt.downsampled_channel_3
        leadOnP = pt.lead_on_p_3
        leadOnN = pt.lead_on_n_3
        qualityBad = pt.quality_3
      }
      const y = yMid - val*yScale

      ctx.strokeStyle = qualityBad ? '#ef4444' : '#34d399'
      if (!leadOnP || !leadOnN){
        ctx.moveTo(x,y)
        continue
      }
      if (i===0){
        ctx.moveTo(x,y)
      } else {
        ctx.lineTo(x,y)
      }
    }
    ctx.stroke()
  }, [data, channel, label, width, height])

  return (
    <div className="bg-white/5 p-2 border border-white/10 rounded-lg">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="w-full h-auto"
      />
    </div>
  )
}```

```// src/components/labs/ECGMultiBar.tsx

import { useState, useMemo } from 'react';
import { useECGAggregates } from '../../hooks/useECGAggregates';
import { ECGTimelineBar } from './ECGTimelineBar';

interface ECGMultiBarsProps {
  podId: string;
  dateStart: string;
  dateEnd: string;
  onFinalSelection?: (startTime: string, endTime: string) => void;
}

export function ECGMultiBar({ podId, dateStart, dateEnd, onFinalSelection }: ECGMultiBarsProps) {
  const [hourRange, setHourRange] = useState<[number, number] | null>(null);
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  // 24h aggregator => bucketSize=3600
  const { data: dayAgg } = useECGAggregates({
    podId,
    startTime: dateStart,
    endTime: dateEnd,
    bucketSize: 3600
  });

  function getTimeFromDayAgg(idx: number): string | null {
    if (!dayAgg.length) return null;
    const c = Math.min(Math.max(0, idx), dayAgg.length - 1);
    return dayAgg[c].time_bucket;
  }

  const topOnSelectRange = (sIdx: number, eIdx: number) => {
    if (sIdx === eIdx) eIdx = sIdx + 1;
    setHourRange([sIdx, eIdx]);
    setZoomRange(null);
  };

  const hourStartISO = useMemo(() => {
    if (!hourRange) return null;
    return getTimeFromDayAgg(hourRange[0]);
  }, [hourRange]);

  const hourEndISO = useMemo(() => {
    if (!hourRange) return null;
    return getTimeFromDayAgg(hourRange[1]);
  }, [hourRange]);

  // 1h aggregator => bucketSize=60
  const { data: hourAgg } = useECGAggregates({
    podId,
    startTime: hourStartISO || dateStart,
    endTime: hourEndISO || dateEnd,
    bucketSize: 60
  });

  function getTimeFromHourAgg(idx: number): string | null {
    if (!hourAgg.length) return null;
    const c = Math.min(Math.max(0, idx), hourAgg.length - 1);
    return hourAgg[c].time_bucket;
  }

  const secondOnSelectRange = (sIdx: number, eIdx: number) => {
    if (sIdx === eIdx) eIdx = sIdx + 1;
    setZoomRange([sIdx, eIdx]);
    const subStart = getTimeFromHourAgg(sIdx);
    const subEnd = getTimeFromHourAgg(eIdx);
    if (subStart && subEnd && onFinalSelection) {
      onFinalSelection(subStart, subEnd);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm text-gray-300">24h Bar (select ~1 hour)</h3>
      <ECGTimelineBar
        data={dayAgg}
        width={800}
        height={30}
        selectedRange={hourRange || undefined}
        onSelectRange={topOnSelectRange}
      />

      {hourRange && (
        <>
          <h3 className="text-sm text-gray-300">
            Hourly Zoom (select ~12 min)
          </h3>
          <ECGTimelineBar
            data={hourAgg}
            width={800}
            height={30}
            selectedRange={zoomRange || undefined}
            onSelectRange={secondOnSelectRange}
          />
        </>
      )}
    </div>
  );
}```

```import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ECGErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ECG Component Crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          <h3 className="font-bold">ECG Display Error</h3>
          <p>Failed to render ECG visualization. Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

```// src/components/labs/DataLab.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStudiesWithTimes } from '../../hooks/useStudiesWithTimes';

function DataLab() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(''); // If you want date-based filters in your RPC, you can add them
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Now we call our RPC-based hook
  const {
    data: studies,
    loading,
    error,
    totalCount,
    isRefreshing
  } = useStudiesWithTimes({
    search: searchQuery,
    page: currentPage,
    pageSize
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  // Handle error
  if (error) {
    return (
      <div className="bg-red-500/10 p-4 text-red-300 rounded-xl">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading && !studies.length && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-blue-400" />
        <h1 className="text-2xl font-semibold text-white">Data Lab (RPC Version)</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            className="w-64 px-4 py-2 pl-10 bg-white/10 border border-white/10 
                       text-white placeholder-gray-400 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40 
                       focus:border-blue-500/40"
          />
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* If you want to pass startDate/endDate to your RPC, define them in the function & hook */}
        <div className="flex gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg
                       text-white placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-blue-500/40 focus:border-blue-500/40"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg
                       text-white placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-blue-500/40 focus:border-blue-500/40"
          />
        </div>
      </div>

      {/* Table of results */}
      {!loading && studies.length === 0 ? (
        <div className="bg-white/10 p-8 text-center rounded-xl border border-white/10">
          <p className="text-gray-400">No studies found.</p>
        </div>
      ) : (
        <div className="bg-white/10 rounded-xl border border-white/10 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Study ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Pod ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Earliest Pod Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Latest Pod Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {studies.map((s) => {
                const earliestStr = s.earliest_time
                  ? new Date(s.earliest_time).toLocaleString()
                  : 'N/A';
                const latestStr = s.latest_time
                  ? new Date(s.latest_time).toLocaleString()
                  : 'N/A';

                return (
                  <tr
                    key={s.study_id}
                    className={`
                      hover:bg-white/5 transition-all duration-200
                      ${loading ? 'opacity-50' : ''}
                      ${isRefreshing ? 'opacity-50' : ''}
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {s.study_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {s.pod_id ?? 'none'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {earliestStr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {latestStr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/ecg/${s.study_id}`)}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 
                                   rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        View ECG
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Showing {studies.length ? currentPage * pageSize + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className={`
              flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium
              ${currentPage === 0
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
              }
            `}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className={`
              flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium
              ${currentPage >= totalPages - 1
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
              }
            `}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataLab;```


```/* ======================================================
   src/components/labs/DailyOverviewBar.tsx
   (Displays aggregator data slices for the chosen day)
   ====================================================== */
   import { AggregatedLeadData } from '../../hooks/useECGAggregates'

   interface DailyOverviewBarProps {
     data: AggregatedLeadData[]
     onSelectHour: (bucketIndex: number) => void
   }
   
   export default function DailyOverviewBar({ data, onSelectHour }: DailyOverviewBarProps) {
     return (
       <div className="flex gap-1">
         {data.map((slice, idx) => {
           const avgQ = (
             (slice.quality_1_percent || 0) +
             (slice.quality_2_percent || 0) +
             (slice.quality_3_percent || 0)
           ) / 3
           let bgColor = 'bg-red-500/50'
           if (avgQ >= 80) bgColor = 'bg-emerald-500/50'
           else if (avgQ >= 50) bgColor = 'bg-orange-500/50'
   
           return (
             <div
               key={idx}
               onClick={() => onSelectHour(idx)}
               title={`Hour ${idx}: ~${avgQ.toFixed(1)}% quality`}
               className={`cursor-pointer h-8 w-full rounded ${bgColor} transition duration-150 hover:scale-105`}
             />
           )
         })}
       </div>
     )
   }```

   ```/* ==============================================================
   src/components/labs/DailyECGAggregator.tsx
   (Or integrate directly into ECGViewerPage)
   ============================================================== */
   import { useEffect } from 'react'
   import { useECGAggregates } from '../../hooks/useECGAggregates'
   import DailyOverviewBar from './DailyOverviewBar'
   
   interface DailyECGAggregatorProps {
     podId: string
     selectedDate: Date
     onHourSelect: (hourIndex: number) => void
   }
   
   export function DailyECGAggregator({
     podId,
     selectedDate,
     onHourSelect
   }: DailyECGAggregatorProps) {
     const dayStart = new Date(Date.UTC(
       selectedDate.getFullYear(),
       selectedDate.getMonth(),
       selectedDate.getDate(),
       0, 0, 0
     )).toISOString()
   
     const dayEnd = new Date(Date.UTC(
       selectedDate.getFullYear(),
       selectedDate.getMonth(),
       selectedDate.getDate(),
       23, 59, 59
     )).toISOString()
   
     const { data, loading, error } = useECGAggregates({
       podId,
       startTime: dayStart,
       endTime: dayEnd,
       bucketSize: 3600
     })
   
     useEffect(() => {
       // You can log or handle side effects if needed
     }, [data])
   
     if (loading) {
       return <div className="text-sm text-gray-400">Loading daily aggregator...</div>
     }
     if (error) {
       return <div className="text-red-400 text-sm">Error: {error}</div>
     }
     if (!data.length) {
       return <div className="text-gray-400 text-sm">No aggregator data for this day.</div>
     }
   
     return (
       <div className="space-y-2">
         <h3 className="text-sm text-white">Daily Overview</h3>
         <DailyOverviewBar data={data} onSelectHour={onHourSelect} />
       </div>
     )
   }```

   ```/* ======================================================
   src/components/labs/CalendarSelectorPodDays.tsx
   (A specialized calendar that only shows days from `pod_days`)
   ====================================================== */
   import { useEffect, useState } from 'react'
   import { ChevronLeft, ChevronRight } from 'lucide-react'
   
   interface CalendarSelectorPodDaysProps {
     availableDays: Date[]
     onChange: (selectedDay: Date) => void
   }
   
   function sameDay(a: Date, b: Date) {
     return (
       a.getUTCFullYear() === b.getUTCFullYear() &&
       a.getUTCMonth() === b.getUTCMonth() &&
       a.getUTCDate() === b.getUTCDate()
     )
   }
   
   export default function CalendarSelectorPodDays({ availableDays, onChange }: CalendarSelectorPodDaysProps) {
     const [currentDate, setCurrentDate] = useState<Date | null>(null)
     const [viewMonth, setViewMonth] = useState<Date>(() => new Date())
   
     useEffect(() => {
       if (availableDays.length) {
         const latest = availableDays[availableDays.length - 1]
         setCurrentDate(latest)
         setViewMonth(new Date(latest.getFullYear(), latest.getMonth(), 1))
         onChange(latest)
       } else {
         setCurrentDate(null)
       }
     }, [availableDays])
   
     const handleSelect = (day: Date) => {
       setCurrentDate(day)
       onChange(day)
     }
   
     const daysInView: Date[] = []
     const startOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
     const endOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
     // Fill days from Sunday to Saturday for the entire month grid
     const daysToPrepend = startOfMonth.getDay()
     for (let i = 0; i < daysToPrepend; i++) {
       const d = new Date(startOfMonth)
       d.setDate(startOfMonth.getDate() - (daysToPrepend - i))
       daysInView.push(d)
     }
     for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
       daysInView.push(new Date(d))
     }
     // Possibly fill next month's first days to make 6 weeks if needed
     while (daysInView.length < 42) {
       const last = daysInView[daysInView.length - 1]
       const next = new Date(last)
       next.setDate(next.getDate() + 1)
       daysInView.push(next)
     }
   
     return (
       <div className="bg-white/10 p-4 rounded-xl border border-white/10 w-72 space-y-3">
         <div className="flex items-center justify-between">
           <button
             onClick={() => {
               const prevMonth = new Date(viewMonth)
               prevMonth.setMonth(prevMonth.getMonth() - 1)
               setViewMonth(prevMonth)
             }}
             className="p-1 hover:bg-white/20 rounded-md text-white"
           >
             <ChevronLeft className="h-5 w-5" />
           </button>
           <span className="text-white text-sm font-medium">
             {viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
           </span>
           <button
             onClick={() => {
               const nextMonth = new Date(viewMonth)
               nextMonth.setMonth(nextMonth.getMonth() + 1)
               setViewMonth(nextMonth)
             }}
             className="p-1 hover:bg-white/20 rounded-md text-white"
           >
             <ChevronRight className="h-5 w-5" />
           </button>
         </div>
         <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
           {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
             <div key={day}>{day}</div>
           ))}
         </div>
         <div className="grid grid-cols-7 gap-1">
           {daysInView.map((dateItem, idx) => {
             const inRange = availableDays.some(d => sameDay(d, dateItem))
             const isSelected = currentDate && sameDay(currentDate, dateItem)
             const isActiveMonth = dateItem.getMonth() === viewMonth.getMonth()
             return (
               <button
                 key={idx}
                 disabled={!inRange}
                 onClick={() => handleSelect(dateItem)}
                 className={`
                   aspect-square rounded-md text-sm
                   ${inRange ? 'hover:bg-white/10 text-white' : 'opacity-30 text-gray-400'}
                   ${isActiveMonth ? '' : 'opacity-50'}
                   ${isSelected ? 'bg-blue-500 text-white' : ''}
                 `}
               >
                 {dateItem.getDate()}
               </button>
             )
           })}
         </div>
       </div>
     )
   }
   ```

   ```// src/hooks/useECGAggregates.ts

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

// Type definition for each row returned by the aggregate_leads RPC
export interface AggregatedLeadData {
  time_bucket: string
  lead_on_p_1?: number
  lead_on_p_2?: number
  lead_on_p_3?: number
  lead_on_n_1?: number
  lead_on_n_2?: number
  lead_on_n_3?: number
  quality_1_percent?: number
  quality_2_percent?: number
  quality_3_percent?: number
}

// Hook props without any timezone parameter
interface UseECGAggregatesProps {
  podId: string | null
  startTime: string
  endTime: string
  bucketSize: number
}

/**
 * useECGAggregates
 *
 * Fetches aggregated ECG lead data based on:
 *  - podId: the device/pod UUID
 *  - startTime and endTime in ISO 8601 (UTC) format
 *  - bucketSize: size of each aggregation bucket in seconds
 *
 * The function calls the 'aggregate_leads' RPC in Supabase.
 * If no podId is provided, returns an empty dataset.
 */
export function useECGAggregates({
  podId,
  startTime,
  endTime,
  bucketSize
}: UseECGAggregatesProps) {
  const [data, setData] = useState<AggregatedLeadData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAggregates = useCallback(async () => {
    if (!podId) {
      setData([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const startMs = new Date(startTime).getTime()
      const endMs = new Date(endTime).getTime()

      // Warn if not a 24-hour selection; you can remove if not needed
      if (endMs - startMs !== 86400000) {
        logger.warn('Non-24h day selection')
      }

      // Call the 'aggregate_leads' RPC without any timezone parameter
      const { data: aggData, error: rpcError } = await supabase.rpc('aggregate_leads', {
        p_pod_id: podId,
        p_time_start: startTime,
        p_time_end: endTime,
        p_bucket_seconds: bucketSize
      })

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      // Ensure the data returned is an array; otherwise default to empty
      setData(Array.isArray(aggData) ? aggData : [])
    } catch (err: any) {
      logger.error('Aggregator fetch error', err)
      setError(err.message || 'Failed to fetch aggregator data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [podId, startTime, endTime, bucketSize])

  // Automatically re-fetch data when dependency values change
  useEffect(() => {
    fetchAggregates()
  }, [fetchAggregates])

  return { data, loading, error }
}```

```// src/hooks/useECGData.ts

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { logger } from '../lib/logger';

export interface ECGData {
  sample_time: string;
  downsampled_channel_1: number;
  downsampled_channel_2: number;
  downsampled_channel_3: number;
  lead_on_p_1: boolean;
  lead_on_p_2: boolean;
  lead_on_p_3: boolean;
  lead_on_n_1: boolean;
  lead_on_n_2: boolean;
  lead_on_n_3: boolean;
  quality_1: boolean;
  quality_2: boolean;
  quality_3: boolean;
}

interface ECGQueryOptions {
  podId: string;
  timeStart: string;
  timeEnd: string;
  maxPoints?: number;
}

export function useECGData(options: ECGQueryOptions) {
  const [data, setData] = useState<ECGData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { podId, timeStart, timeEnd, maxPoints = 2000 } = options;

  const requestBody = useMemo(() => ({
    pod_id: podId,
    time_start: timeStart,
    time_end: timeEnd,
    max_pts: maxPoints
  }), [podId, timeStart, timeEnd, maxPoints]);

  const fetchECG = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData([]);

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      logger.info("Requesting ECG data (single-chunk)", requestBody);
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/downsample-ecg`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(requestBody),
          signal: abortRef.current.signal
        }
      );

      if (!resp.ok) {
        throw new Error(`HTTP error: ${resp.status}`);
      }

      const json = await resp.json();
      if (!Array.isArray(json)) {
        throw new Error("Downsample ECG response is not an array");
      }

      json.sort(
        (a: ECGData, b: ECGData) =>
          new Date(a.sample_time).getTime() - new Date(b.sample_time).getTime()
      );

      setData(json);
      logger.info(`ECG data loaded. Points: ${json.length}`, { subwindow: [timeStart, timeEnd] });
    } catch (err: any) {
      if (err.name === "AbortError") {
        logger.info("ECG data fetch aborted");
        return;
      }
      logger.error("ECG data fetch error", err);
      setError(err.message || "Failed to load ECG data");
    } finally {
      setLoading(false);
    }
  }, [requestBody, timeStart, timeEnd]);

  useEffect(() => {
    if (!podId || !timeStart || !timeEnd) {
      setError("Missing podId or time range");
      setLoading(false);
      return;
    }
    fetchECG();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [podId, timeStart, timeEnd, fetchECG]);

  return { data, loading, error };
}```


```
/* =========================================
   src/hooks/useDownsampleECG.ts (Phase 4)
   ========================================= */
   import { useState, useEffect } from 'react'
   import { supabase } from '../lib/supabase'
   import { logger } from '../lib/logger'
   
   export interface DownsamplePoint {
     sample_time: string
     downsampled_channel_1: number
     downsampled_channel_2: number
     downsampled_channel_3: number
     lead_on_p_1: boolean
     lead_on_p_2: boolean
     lead_on_p_3: boolean
     lead_on_n_1: boolean
     lead_on_n_2: boolean
     lead_on_n_3: boolean
     quality_1: boolean
     quality_2: boolean
     quality_3: boolean
   }
   
   interface UseDownsampleParams {
     pod_id: string
     time_start: string
     time_end: string
     max_pts?: number
   }
   
   export function useDownsampleECG({
     pod_id,
     time_start,
     time_end,
     max_pts = 2000
   }: UseDownsampleParams) {
     const [data, setData] = useState<DownsamplePoint[]>([])
     const [loading, setLoading] = useState(false)
     const [error, setError] = useState<string | null>(null)
   
     useEffect(() => {
       if (!pod_id || !time_start || !time_end) {
         setData([])
         return
       }
       let canceled = false
       setLoading(true)
       setError(null)
       ;(async () => {
         try {
           const { data: result, error: fnError } = await supabase.functions.invoke('downsample-ecg', {
             body: {
               pod_id,
               time_start,
               time_end,
               max_pts
             }
           })
           if (fnError) throw fnError
           if (canceled) return
           if (!Array.isArray(result)) {
             throw new Error('Downsample function did not return an array.')
           }
           setData(result)
         } catch (err: any) {
           if (!canceled) {
             logger.error('Downsample fetch error', err)
             setError(err.message || 'Failed to downsample ECG data')
             setData([])
           }
         } finally {
           if (!canceled) setLoading(false)
         }
       })()
       return () => {
         canceled = true
       }
     }, [pod_id, time_start, time_end, max_pts])
   
     return { data, loading, error }
   }
   ```

   ```// src/hooks/useSingleStudy.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SingleStudyRow {
  study_id: string;
  pod_id: string | null;
  clinic_id: string | null;
  start_timestamp: string | null;
  end_timestamp: string | null;
  earliest_time: string | null;
  latest_time: string | null;
}

export function useSingleStudy(studyId?: string) {
  const [study, setStudy] = useState<SingleStudyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    if (!studyId) {
      setLoading(false);
      return;
    }
    async function fetchStudy() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcErr } = await supabase
          .rpc('get_study_details_with_earliest_latest', { p_study_id: studyId });
        if (rpcErr) throw new Error(rpcErr.message);

        if (!data || data.length === 0) {
          setStudy(null);
        } else {
          setStudy(data[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load study');
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    fetchStudy();
    return () => {
      canceled = true;
    };
  }, [studyId]);

  return { study, loading, error };
}```


```// src/hooks/useStudiesWithTimes.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

interface StudiesWithTimesRow {
  study_id: string;
  pod_id: string | null;
  start_timestamp: string | null;
  end_timestamp: string | null;
  earliest_time: string | null;
  latest_time: string | null;
  total_count: number;
}

interface FilterOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useStudiesWithTimes({ search, page = 0, pageSize = 25 }: FilterOptions) {
  const [data, setData] = useState<StudiesWithTimesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function fetchRPC() {
      try {
        setIsRefreshing(true);
        setLoading(true);
        setError(null);

        const offset = page * pageSize;
        const limit = pageSize;

        // Call the RPC:
        const { data: rpcData, error: rpcErr } = await supabase
          .rpc('get_study_list_with_earliest_latest', {
            p_search: search || null,
            p_offset: offset,
            p_limit: limit
          });

        if (rpcErr) {
          throw new Error(rpcErr.message);
        }
        if (!rpcData) {
          setData([]);
          setTotalCount(0);
          return;
        }

        // Convert rpcData to array of rows
        // Postgres returns an array of { study_id, earliest_time, latest_time, total_count, ... }
        const typed = rpcData as StudiesWithTimesRow[];

        // total_count is the same on every row, so just read from first row (if exists)
        let globalCount = 0;
        if (typed.length > 0) {
          globalCount = Number(typed[0].total_count || 0);
        }

        if (!isCancelled) {
          setData(typed);
          setTotalCount(globalCount);
        }
      } catch (err: any) {
        logger.error('RPC fetch error', err);
        if (!isCancelled) {
          setError(err.message || 'Failed to load data');
          setData([]);
          setTotalCount(0);
        }
      } finally {
        if (!isCancelled) {
          setIsRefreshing(false);
          setLoading(false);
        }
      }
    }

    fetchRPC();

    return () => {
      isCancelled = true;
    };
  }, [search, page, pageSize]);

  return {
    data,
    loading,
    error,
    isRefreshing,
    totalCount
  };
}```


```import { useState, useEffect, useCallback, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;
}```

```// src/hooks/useDataQueries.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase'; 
import { logger } from '../lib/logger';
import { useDebounce } from './useDebounce';

interface DataFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export function useDataQueries(filters: DataFilters = {}) {
  const isMounted = useRef(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studies, setStudies] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 300);
  const prevKeyRef = useRef<string>();

  const fetchData = useCallback(async () => {
    const key = JSON.stringify({ ...filters, search: debouncedSearch });
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    try {
      setIsRefreshing(true);
      if (!studies.length) setLoading(true);

      const start = (filters.page || 0) * (filters.pageSize || 25);
      const end = start + (filters.pageSize || 25) - 1;

      let query = supabase
        .from('study')
        .select(`
          *, 
          clinics!inner ( name ), 
          pod!inner ( status )
        `, { count: 'exact' });

      // optional search
      if (debouncedSearch) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(debouncedSearch);
        if (isUUID) {
          query = query.or(`study_id.eq.${debouncedSearch},pod_id.eq.${debouncedSearch}`);
        } else {
          // for example, searching clinic name
          query = query.ilike('clinics.name', `%${debouncedSearch}%`);
        }
      }

      // optional date filters
      if (filters.startDate) {
        query = query.gte('start_timestamp', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('end_timestamp', filters.endDate);
      }

      // pagination
      query = query.range(start, end);

      const { data, error: qErr, count } = await query;
      if (qErr) {
        logger.error('DB error in useDataQueries', qErr);
        throw new Error(qErr.message);
      }

      setStudies(data || []);
      setTotalCount(count || 0);
      setError(null);
    } catch (err: any) {
      logger.error('Data fetch error', err);
      setError('Failed to load data');
      if (isMounted.current) {
        setStudies([]);
        setTotalCount(0);
      }
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [filters, debouncedSearch, studies.length]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { studies, loading, error, totalCount, isRefreshing };
}
```
<relevant_existing_components_and_hooks>
