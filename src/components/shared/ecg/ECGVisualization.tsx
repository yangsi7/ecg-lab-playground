import React, { useRef, useEffect } from 'react';

interface ECGVisualizationProps {
  data: any[]; // Replace 'any[]' with your actual data type
}

const ECGVisualization: React.FC<ECGVisualizationProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Basic Canvas Setup (adjust as needed)
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.beginPath();
    context.strokeStyle = 'blue';

    // Very simplified drawing logic (replace with your actual ECG rendering)
    data.forEach((item, index) => {
      const x = (index / data.length) * width;
      const y = height - (item.value / 100) * height; // Assuming 'value' is a field, adjust!
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });

    context.stroke();
  }, [data]);

  return (
    <canvas ref={canvasRef} width={300} height={150} className="border" />
  );
};

export default ECGVisualization;
