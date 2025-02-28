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
  colorBlindMode
}: UseECGCanvasParams): UseECGCanvasResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Horizontal zoom/pan
  const [scaleX, setScaleX] = useState(1);
  const [translateX, setTranslateX] = useState(0);
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
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1.1 : 0.9;
    setScaleX((prev) => {
      const next = prev * direction;
      if (next < 0.5) return 0.5;
      if (next > 10) return 10;
      return next;
    });
  }, []);

  // Add event listener with passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1.1 : 0.9;
      setScaleX((prev) => {
        const next = prev * direction;
        if (next < 0.5) return 0.5;
        if (next > 10) return 10;
        return next;
      });
    };

    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, []);

  // Mouse handlers for panning
  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    setPanning(true);
    setPanStartX(e.clientX);
  }, []);

  const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    if (!panning) return;
    const dx = e.clientX - panStartX;
    setTranslateX((prev) => prev + dx);
    setPanStartX(e.clientX);
  }, [panning, panStartX]);

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
    data.forEach(pt => {
      let v = 0;
      if (channel === 1) v = pt.downsampled_channel_1;
      else if (channel === 2) v = pt.downsampled_channel_2;
      else v = pt.downsampled_channel_3;
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    });
    if (minVal === Infinity || maxVal === -Infinity) return;
    const pad = (maxVal - minVal) * 0.1;
    setYMin(minVal - pad);
    setYMax(maxVal + pad);
  }, [data, channel]);

  const toggleColorBlindMode = useCallback(() => {
    setIsColorBlindMode(prev => !prev);
  }, []);

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