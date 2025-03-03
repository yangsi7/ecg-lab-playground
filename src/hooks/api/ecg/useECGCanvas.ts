import { useState, useCallback, useRef, useEffect } from 'react';
import type { ECGData } from '../../../types/domain/ecg';
import type { WheelEventHandler, MouseEventHandler } from 'react';

export interface UseECGCanvasParams {
  data: ECGData[];
  channel: 1 | 2 | 3;
  width: number;
  height: number;
  defaultYMin: number;
  defaultYMax: number;
  colorBlindMode: boolean;
  // Shared state for synchronized plots
  sharedScaleX?: number;
  sharedTranslateX?: number;
  onScaleChange?: (scale: number) => void;
  onTranslateChange?: (translate: number) => void;
  syncEnabled?: boolean;
}

export interface UseECGCanvasResult {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  scaleX: number;
  translateX: number;
  yMin: number;
  yMax: number;
  isColorBlindMode: boolean;
  showTooltip: boolean;
  tooltipX: number;
  tooltipY: number;
  tooltipText: string;
  waveColor: string;
  handleWheel: WheelEventHandler<HTMLCanvasElement>;
  handleMouseDown: MouseEventHandler<HTMLCanvasElement>;
  handleMouseMove: MouseEventHandler<HTMLCanvasElement>;
  handleMouseUp: MouseEventHandler<HTMLCanvasElement>;
  handleMouseLeave: MouseEventHandler<HTMLCanvasElement>;
  zoomInRange: () => void;
  zoomOutRange: () => void;
  fitYRange: () => void;
  toggleColorBlindMode: () => void;
}

export function useECGCanvas({
  data,
  channel,
  width,
  height,
  defaultYMin,
  defaultYMax,
  colorBlindMode,
  // Shared state for synchronized plots
  sharedScaleX,
  sharedTranslateX,
  onScaleChange,
  onTranslateChange,
  syncEnabled = false
}: UseECGCanvasParams): UseECGCanvasResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Horizontal zoom/pan - use shared state if provided
  const [localScaleX, setLocalScaleX] = useState(1);
  const [localTranslateX, setLocalTranslateX] = useState(0);
  
  // Use shared values if sync is enabled, otherwise use local state
  const scaleX = syncEnabled && sharedScaleX !== undefined ? sharedScaleX : localScaleX;
  const translateX = syncEnabled && sharedTranslateX !== undefined ? sharedTranslateX : localTranslateX;
  
  // Wrapper functions to update both local and shared state
  const setScaleX = useCallback((value: number | ((prev: number) => number)) => {
    const newValue = typeof value === 'function' ? value(localScaleX) : value;
    setLocalScaleX(newValue);
    if (syncEnabled && onScaleChange) {
      onScaleChange(newValue);
    }
  }, [localScaleX, syncEnabled, onScaleChange]);
  
  const setTranslateX = useCallback((value: number | ((prev: number) => number)) => {
    const newValue = typeof value === 'function' ? value(localTranslateX) : value;
    setLocalTranslateX(newValue);
    if (syncEnabled && onTranslateChange) {
      onTranslateChange(newValue);
    }
  }, [localTranslateX, syncEnabled, onTranslateChange]);
  const [panning, setPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);

  // Y-range management
  const [yMin, setYMin] = useState(defaultYMin);
  const [yMax, setYMax] = useState(defaultYMax);

  // Tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipX, setTooltipX] = useState(0);
  const [tooltipY, setTooltipY] = useState(0);
  const [tooltipText, setTooltipText] = useState('');

  // Color-blind mode
  const [isColorBlindMode, setIsColorBlindMode] = useState(colorBlindMode);
  const waveColorNormal = 'rgba(129,230,217,0.8)'; // pastel teal
  const waveColorBlind = 'rgba(0,120,180,0.9)';
  const waveColor = isColorBlindMode ? waveColorBlind : waveColorNormal;

  // MouseWheel => horizontal zoom
  const handleWheel: WheelEventHandler<HTMLCanvasElement> = useCallback((e) => {
    // Fix preventDefault issue by not using it in a passive event handler
    // Instead, we'll set up a non-passive event listener in useEffect
    const direction = e.deltaY < 0 ? 1.1 : 0.9;
    setScaleX((prev) => {
      const next = prev * direction;
      return Math.max(0.5, Math.min(10, next));
    });
  }, [setScaleX]);
  
  // Set up non-passive wheel event listener to properly handle preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1.1 : 0.9;
      setScaleX((prev) => {
        const next = prev * direction;
        return Math.max(0.5, Math.min(10, next));
      });
    };
    
    // Add event listener with passive: false to allow preventDefault
    canvas.addEventListener('wheel', handleWheelEvent, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheelEvent);
    };
  }, [setScaleX]);

  // Mouse handlers for panning - with performance optimizations
  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    setPanning(true);
    setPanStartX(e.clientX);
  }, []);

  // Use requestAnimationFrame for smoother panning
  const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    if (!panning) {
      // Handle tooltip display when not panning
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find the closest data point
        if (data.length > 0) {
          const canvasWidth = canvas.width;
          const dataIndex = Math.min(
            Math.floor((x / canvasWidth) * data.length),
            data.length - 1
          );
          
          if (dataIndex >= 0) {
            const point = data[dataIndex];
            let value = 0;
            
            if (channel === 1) value = point.downsampled_channel_1;
            else if (channel === 2) value = point.downsampled_channel_2;
            else value = point.downsampled_channel_3;
            
            const time = new Date(point.sample_time).toLocaleTimeString();
            setTooltipText(`Time: ${time}, Value: ${value.toFixed(2)}`);
            setTooltipX(x);
            setTooltipY(y);
            setShowTooltip(true);
          }
        }
      }
      return;
    }
    
    // Use requestAnimationFrame for better performance during panning
    requestAnimationFrame(() => {
      const dx = e.clientX - panStartX;
      setTranslateX((prev) => prev + dx);
      setPanStartX(e.clientX);
    });
  }, [panning, panStartX, data, channel, setTranslateX]);

  const handleMouseUp: MouseEventHandler<HTMLCanvasElement> = useCallback(() => {
    setPanning(false);
  }, []);

  const handleMouseLeave: MouseEventHandler<HTMLCanvasElement> = useCallback(() => {
    setPanning(false);
    setShowTooltip(false);
  }, []);

  // Y-range adjustments
  const zoomOutRange = useCallback(() => {
    setYMin(m => m * 1.2);
    setYMax(m => m * 1.2);
  }, []);

  const zoomInRange = useCallback(() => {
    setYMin(m => m * 0.8);
    setYMax(m => m * 0.8);
  }, []);

  const fitYRange = useCallback(() => {
    if (!data.length) return;
    
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    // Performance optimization: only check every nth point for large datasets
    const step = data.length > 5000 ? Math.floor(data.length / 5000) : 1;
    
    for (let i = 0; i < data.length; i += step) {
      const pt = data[i];
      let v = 0;
      
      if (channel === 1) v = pt.downsampled_channel_1;
      else if (channel === 2) v = pt.downsampled_channel_2;
      else v = pt.downsampled_channel_3;
      
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    
    if (minVal === Infinity || maxVal === -Infinity) return;
    
    const pad = (maxVal - minVal) * 0.1;
    setYMin(minVal - pad);
    setYMax(maxVal + pad);
  }, [data, channel]);

  // Update Y range when channel changes
  useEffect(() => {
    if (data.length > 0) {
      fitYRange();
    }
  }, [channel, fitYRange]);

  const toggleColorBlindMode = useCallback(() => {
    setIsColorBlindMode(prev => !prev);
  }, []);

  // Add keyboard navigation support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== canvas) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          setTranslateX(prev => prev - 20);
          break;
        case 'ArrowRight':
          setTranslateX(prev => prev + 20);
          break;
        case '+':
          zoomInRange();
          break;
        case '-':
          zoomOutRange();
          break;
        case 'f':
          fitYRange();
          break;
        case 'c':
          toggleColorBlindMode();
          break;
      }
    };
    
    canvas.addEventListener('keydown', handleKeyDown);
    return () => {
      canvas.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomInRange, zoomOutRange, fitYRange, toggleColorBlindMode, setTranslateX]);
  
  // Set up non-passive touch event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        setPanning(true);
        setPanStartX(x);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!panning || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      
      requestAnimationFrame(() => {
        const dx = x - panStartX;
        setTranslateX((prev) => prev + dx);
        setPanStartX(x);
      });
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setPanning(false);
    };
    
    // Add event listeners with passive: false to allow preventDefault
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [panning, panStartX, setTranslateX]);

  return {
    canvasRef,
    scaleX,
    translateX,
    yMin,
    yMax,
    isColorBlindMode,
    showTooltip,
    tooltipX,
    tooltipY,
    tooltipText,
    waveColor,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    zoomInRange,
    zoomOutRange,
    fitYRange,
    toggleColorBlindMode
  };
}
