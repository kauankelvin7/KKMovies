/* KauanFlix — Star Rating Component */
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
    <div className="inline-flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => {
          const isFull = i < full;
          const isPartial = i === full && partial > 0.2;
          return (
            <div key={i} className="relative" style={{ width: size, height: size }}>
              <Star
                className="absolute inset-0 star-empty"
                size={size}
                strokeWidth={1.5}
              />
              {(isFull || isPartial) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isFull ? '100%' : `${partial * 100}%` }}
                >
                  <Star
                    className="star-filled"
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
      {showValue && (
        <span className="text-xs font-medium text-kf-yellow ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
