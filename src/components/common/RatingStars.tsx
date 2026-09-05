import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number; // 0 - 5
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  count,
  size = 'md',
  showNumber = true,
}) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center text-amber-500">
        {[1, 2, 3, 4, 5].map(starIndex => {
          const isFull = rating >= starIndex;
          const isHalf = rating >= starIndex - 0.5 && rating < starIndex;
          return (
            <Star
              key={starIndex}
              className={`${iconSize} ${
                isFull
                  ? 'fill-amber-500 text-amber-500'
                  : isHalf
                  ? 'fill-amber-500/50 text-amber-500'
                  : 'text-amber-200 dark:text-zinc-700'
              }`}
            />
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          ({count})
        </span>
      )}
    </div>
  );
};
