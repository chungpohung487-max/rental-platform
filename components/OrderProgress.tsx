'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';

const STEPS = ['申請中', '雙方確認', '面交驗貨', '租借中', '歸還確認', '完成'];

interface OrderProgressProps {
  status: string;
  buyerConfirmed?: number;
  sellerConfirmed?: number;
  handoverBuyerPhotos?: string;
  handoverSellerPhotos?: string;
}

export function getOrderStep(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    handover: 2,
    active: 3,
    returning: 4,
    disputed: 4,
    completed: 5,
    cancelled: -1,
  };
  return map[status] ?? 0;
}

export function OrderProgress({ status, buyerConfirmed, sellerConfirmed, handoverBuyerPhotos, handoverSellerPhotos }: OrderProgressProps) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
        <Circle className="w-3.5 h-3.5" />
        訂單已取消
      </div>
    );
  }

  const currentStep = getOrderStep(status);

  // Sub-state info for tooltip/detail
  const subInfo: Record<number, string | null> = {
    1: status === 'confirmed'
      ? `買家${buyerConfirmed ? '✓' : '○'} 賣家${sellerConfirmed ? '✓' : '○'}`
      : null,
    2: status === 'handover'
      ? `買家${JSON.parse(handoverBuyerPhotos || '[]').length > 0 ? '✓' : '○'} 賣家${JSON.parse(handoverSellerPhotos || '[]').length > 0 ? '✓' : '○'}`
      : null,
  };

  return (
    <div className="w-full">
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const isLast = i === STEPS.length - 1;

          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  done
                    ? 'bg-wood text-white'
                    : active
                    ? 'bg-wood/20 border-2 border-wood text-wood'
                    : 'bg-surface border-2 border-border text-subtle'
                }`}>
                  {done ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : active ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="text-center">
                  <span className={`text-[10px] font-medium leading-tight block ${
                    done ? 'text-wood' : active ? 'text-primary' : 'text-subtle'
                  }`}>
                    {label}
                  </span>
                  {subInfo[i] && (
                    <span className="text-[9px] text-muted block">{subInfo[i]}</span>
                  )}
                </div>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-1 mb-5 rounded ${i < currentStep ? 'bg-wood' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
