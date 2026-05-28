'use client';

import { Star } from 'lucide-react';

interface Props {
  rating: number;
  onChange?: (r: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ rating, onChange, size = 'md' }: Props) {
  const cls = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }[size];
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          disabled={!onChange}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${cls} transition-colors ${
              s <= rating ? 'text-wood fill-wood' : 'text-border fill-border'
            } ${onChange ? 'hover:text-wood hover:fill-wood' : ''}`}
          />
        </button>
      ))}
    </div>
  );
}
