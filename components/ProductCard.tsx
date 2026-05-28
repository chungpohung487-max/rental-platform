'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Package, ShieldCheck } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  images: string;
  daily_rent: number;
  deposit: number;
  location: string;
  seller_name: string;
  seller_rating: number;
  seller_rating_count: number;
  seller_verified?: number;
  available_quantity?: number;
  billing_unit?: string;
}

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  const images: string[] = JSON.parse(product.images || '[]');
  const unitLabel = product.billing_unit === 'hourly' ? '小時' : product.billing_unit === 'monthly' ? '月' : '天';
  const isSoldOut = product.available_quantity !== undefined && product.available_quantity === 0;

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="bg-card border border-border rounded-[18px] overflow-hidden muji-shadow zx-card-hover">
        {/* Image — 4:3 aspect ratio per design */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: '4/3',
            background: 'linear-gradient(135deg, var(--pink-100) 0%, var(--surface) 100%)',
          }}
        >
          {images[0] ? (
            <img
              src={images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
              style={{ transition: 'transform 0.4s var(--ease-out)' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Package className="w-10 h-10" style={{ color: 'var(--wood)', opacity: 0.25 }} />
            </div>
          )}

          {/* Category pill — top-left */}
          <span
            className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', color: 'var(--text)' }}
          >
            {product.category}
          </span>

          {/* Availability badge — top-left secondary */}
          {isSoldOut && (
            <span
              className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full text-white"
              style={{ background: 'rgba(31,26,28,.65)' }}
            >
              已出租
            </span>
          )}

          {/* Favorite button — top-right circle */}
          <button
            onClick={(e) => { e.preventDefault(); setLiked(v => !v); }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-base transition-transform hover:scale-110"
            style={{
              background: 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(8px)',
              color: liked ? 'var(--wood)' : 'var(--subtle)',
              boxShadow: 'var(--shadow-xs)',
            }}
            aria-label="收藏"
          >
            {liked ? '♥' : '♡'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-sm leading-snug line-clamp-1" style={{ color: 'var(--text)' }}>
            {product.title}
          </h3>

          {/* Rating + location row */}
          <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: 'var(--subtle)' }}>
            {product.seller_rating > 0 ? (
              <>
                <span className="font-bold" style={{ color: 'var(--wood-dk)' }}>
                  ★ {product.seller_rating.toFixed(1)}
                </span>
                {product.seller_rating_count > 0 && (
                  <span>({product.seller_rating_count})</span>
                )}
                <span>·</span>
              </>
            ) : (
              <span style={{ color: 'var(--subtle)' }}>新出租者 ·</span>
            )}
            {product.location && (
              <span className="flex items-center gap-0.5 line-clamp-1">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                {product.location}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-0.5 mt-3">
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>NT$</span>
            <span className="font-bold text-xl leading-none" style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {product.daily_rent.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>/{unitLabel}</span>
          </div>

          {/* Seller row */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--pink-400), var(--pink-700))' }}
            >
              {product.seller_name.charAt(0)}
            </div>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{product.seller_name}</span>
            {product.seller_verified === 1 && (
              <span
                className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ border: '1px solid rgba(236,103,136,.25)', background: 'var(--pink-50)', color: 'var(--pink-700)' }}
              >
                <ShieldCheck className="w-2.5 h-2.5" />
                認證
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
