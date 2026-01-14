import React, { useRef, useState, useEffect } from 'react';

interface ImageComparisonProps {
  original: string;
  generated: string;
  className?: string;
  minHeight?: number | string;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({ original, generated, className = '', minHeight = 240 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  const getRelativePosition = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return 50;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    return (x / rect.width) * 100;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    if ('touches' in e && e.touches.length) {
      setSliderPosition(getRelativePosition(e.touches[0].clientX));
    } else if ('clientX' in e) {
      setSliderPosition(getRelativePosition(e.clientX));
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    if ('touches' in e && e.touches.length) {
      setSliderPosition(getRelativePosition(e.touches[0].clientX));
    } else if ('clientX' in e) {
      setSliderPosition(getRelativePosition(e.clientX));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ minHeight, userSelect: 'none', touchAction: 'none' }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
    >
      {/* Generated / After image as background */}
      <div className="absolute inset-0">
        <img src={generated} alt="Generated" className="w-full h-full object-cover" draggable={false} />
      </div>

      {/* Original / Before image clipped overlay */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={original} alt="Original" className="w-full h-full object-cover" draggable={false} />
      </div>

      {/* Slider handle */}
      <div
        className={`absolute top-0 bottom-0 z-10 transition-all ${isDragging ? '' : ''}`}
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-1 bg-white/80 h-full shadow-md" />
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center">
          <span className="text-sm">⇄</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-xs">Original</div>
      <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs">AI Generated</div>
    </div>
  );
};

export default ImageComparison;


