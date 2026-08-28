import React from 'react';
import { Star } from 'lucide-react';

interface Props {
  rating: number; // 0-10
  maxStars?: number;
  size?: number;
  showValue?: boolean;
}

export const StarRating: React.FC<Props> = ({ rating, maxStars = 5, size = 14, showValue = true }) => {
  const normalized = (rating / 10) * maxStars;
  const full = Math.floor(normalized);
  const partial = normalized - full;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => {
          const isFull = i < full;
          const isPartial = i === full && partial > 0.2;
          
          return (
            <div key={i} className="relative" style={{ width: size, height: size }}>
              {/* Empty/Background Star */}
              <Star
                className="absolute inset-0 text-[rgba(255,255,255,0.15)] transition-colors"
                size={size}
                strokeWidth={1.5}
              />
              
              {/* Filled/Foreground Star */}
              {(isFull || isPartial) && (
                <div
                  className="absolute inset-0 overflow-hidden text-[var(--accent-gold)] drop-shadow-[0_0_8px_rgba(201,151,58,0.3)] transition-all"
                  style={{ width: isFull ? '100%' : `${partial * 100}%` }}
                >
                  <Star
                    size={size}
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Text Value */}
      {showValue && (
        <span className="text-[12px] font-medium text-[var(--accent-gold)] tracking-tight ml-0.5">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};