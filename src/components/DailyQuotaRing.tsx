import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Clock, 
  Zap, 
  ArrowRight, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck,
  Flame
} from 'lucide-react';

interface DailyQuotaRingProps {
  className?: string;
}

export const DailyQuotaRing: React.FC<DailyQuotaRingProps> = ({ className = '' }) => {
  const { 
    currentUser, 
    dailyLimit, 
    remainingDailyUses, 
    openCheckout, 
    resetDailyUsage 
  } = useApp();

  const isPro = currentUser.role === 'pro' || currentUser.role === 'admin' || currentUser.plan !== 'free';
  const usedCount = currentUser.dailyConversionsCount;
  const remainingCount = isPro ? 999 : Math.max(0, dailyLimit - usedCount);

  // Time remaining until next midnight calculation
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next 00:00:00
      const diffMs = midnight.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilReset(
        `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // SVG circular geometry
  const size = 140;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Ratio calculation: remaining out of dailyLimit (3)
  const remainingRatio = isPro ? 1 : Math.max(0, Math.min(1, remainingCount / dailyLimit));
  const strokeDashoffset = circumference - remainingRatio * circumference;

  // Determine warning level
  const isNearLimit = !isPro && remainingCount === 1;
  const isLimitReached = !isPro && remainingCount === 0;

  // Color mapping
  let ringColor = 'stroke-indigo-600';
  let badgeText = 'Nominal Quota';
  let badgeColor = 'bg-slate-100 text-slate-700';

  if (isPro) {
    ringColor = 'stroke-indigo-600';
    badgeText = 'Pro Unlimited';
    badgeColor = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
  } else if (isLimitReached) {
    ringColor = 'stroke-rose-600';
    badgeText = 'Limit Reached (0/3)';
    badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200';
  } else if (isNearLimit) {
    ringColor = 'stroke-amber-500';
    badgeText = '1 Conversion Left';
    badgeColor = 'bg-amber-50 text-amber-800 border border-amber-200';
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs ${className}`}>
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daily Conversion Quota</h3>
            <p className="text-[11px] text-slate-500">Free tier resets every 24 hours</p>
          </div>
        </div>

        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
          {badgeText}
        </span>
      </div>

      {/* Center Layout: Progress Ring + Info */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        
        {/* SVG Circular Progress Ring */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90 filter drop-shadow-2xs"
          >
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 fill-none"
            />
            
            {/* Animated Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${ringColor} fill-none transition-all duration-700 ease-out`}
            />
          </svg>

          {/* Text inside the ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            {isPro ? (
              <>
                <span className="text-3xl font-extrabold text-indigo-600 leading-none">∞</span>
                <span className="text-[10px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">
                  Unlimited
                </span>
              </>
            ) : (
              <>
                <span className={`text-3xl font-extrabold tracking-tight tabular-nums leading-none ${
                  isLimitReached ? 'text-rose-600' : isNearLimit ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  {remainingCount}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">
                  of {dailyLimit} left
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status Details & Breakdown */}
        <div className="grow space-y-3 w-full">
          
          {/* Conversions Slots (1, 2, 3) */}
          {!isPro ? (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Free Daily Allowance:</span>
                <span className="tabular-nums font-mono text-slate-500">
                  {usedCount} / {dailyLimit} used
                </span>
              </div>

              {/* 3 Interactive Slots Pill Indicators */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((slotNumber) => {
                  const isSlotUsed = usedCount >= slotNumber;
                  return (
                    <div
                      key={slotNumber}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isSlotUsed
                          ? 'bg-slate-50 border-slate-200 text-slate-400'
                          : 'bg-indigo-50/50 border-indigo-200 text-indigo-700 shadow-2xs'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold tracking-wider">
                        Slot #{slotNumber}
                      </p>
                      <p className="text-xs font-semibold mt-0.5">
                        {isSlotUsed ? 'Used' : 'Available'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>NexiPDF Pro Active</span>
              </div>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                You have unlimited daily conversions across all 8 tools with priority multi-threaded speed.
              </p>
            </div>
          )}

          {/* Reset Timer */}
          {!isPro && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Next Quota Reset:</span>
              </span>
              <span className="font-mono font-semibold text-slate-700 tabular-nums">
                {timeUntilReset || 'Midnight UTC'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Prominent 'Go Pro' Call to Action (When reaching limit or 2/3 used or exhausted) */}
      {!isPro && (
        <div className={`mt-6 pt-5 border-t ${
          isLimitReached 
            ? 'border-rose-100 bg-rose-50/40 -mx-6 -mb-6 p-6 rounded-b-2xl'
            : isNearLimit
            ? 'border-amber-100 bg-amber-50/30 -mx-6 -mb-6 p-6 rounded-b-2xl'
            : 'border-slate-100'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                {isLimitReached ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : isNearLimit ? (
                  <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
                <span className={`text-xs font-bold ${
                  isLimitReached ? 'text-rose-900' : isNearLimit ? 'text-amber-900' : 'text-slate-900'
                }`}>
                  {isLimitReached
                    ? 'Limit reached for today — Go Pro for instant access'
                    : isNearLimit
                    ? 'Running low on conversions — Upgrade to Pro'
                    : 'Need unlimited conversions and 2GB files?'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLimitReached
                  ? 'Do not wait for midnight. Upgrade now for unlimited batch conversions.'
                  : 'Get unlimited runs 24/7, max 2GB files, and zero wait times for just $9/month.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openCheckout('pro_monthly')}
                className={`px-4 py-2 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isLimitReached
                    ? 'bg-rose-600 hover:bg-rose-700 hover:shadow-md'
                    : isNearLimit
                    ? 'bg-amber-600 hover:bg-amber-700 hover:shadow-md'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Go Pro ($9/mo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Demo test helper button */}
              <button
                onClick={resetDailyUsage}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Reset quota to 3 free uses (Demo)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
