import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X, Check, Zap, Lock, Clock } from 'lucide-react';

export const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, setIsUpgradeModalOpen, openCheckout, dailyLimit } = useApp();

  if (!isUpgradeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={() => setIsUpgradeModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-8 pb-6 bg-linear-to-b from-indigo-50/60 to-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>

          <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full inline-block mb-2">
            Daily Free Quota Reached ({dailyLimit}/{dailyLimit} Used)
          </span>

          <h3 className="text-2xl font-bold tracking-tight text-slate-900">
            Unlock Unlimited Document Conversions
          </h3>

          <p className="mt-2 text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            You've used all 3 free conversions for today. Upgrade to NexiPDF Pro for instant unlimited access, or wait until midnight UTC for your quota to reset.
          </p>
        </div>

        {/* Features Checklist */}
        <div className="px-8 py-4 bg-slate-50/60 border-y border-slate-100">
          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 shrink-0 font-bold" />
              <span><strong>Unlimited daily conversions</strong> across all 8 tools</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Upload massive documents up to <strong>2,048 MB (2 GB)</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Priority multi-threaded CPU processing speed</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Bulk batch operations & single-click ZIP archives</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="p-8 pt-6">
          <button
            onClick={() => openCheckout('pro_monthly')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Upgrade to Pro Now for $9/mo</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <p className="text-[11px] text-slate-400 text-center mt-3">
            Secure checkout powered by Stripe · Cancel anytime with 1 click
          </p>
        </div>
      </div>
    </div>
  );
};
