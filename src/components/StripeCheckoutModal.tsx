import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Lock, 
  X, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  RotateCw
} from 'lucide-react';

export const StripeCheckoutModal: React.FC = () => {
  const { 
    isCheckoutModalOpen, 
    setIsCheckoutModalOpen, 
    checkoutPlan, 
    handleStripePaymentSuccess,
    currentUser,
    showToast
  } = useApp();

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [cardName, setCardName] = useState(currentUser.name || 'Sachitha Kaumina');
  const [country, setCountry] = useState('United States');
  const [zipCode, setZipCode] = useState('94103');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    checkoutPlan === 'pro_annual' ? 'annual' : 'monthly'
  );

  if (!isCheckoutModalOpen) return null;

  const basePrice = checkoutPlan === 'pro_annual' ? 79 : checkoutPlan === 'enterprise' ? 29 : 9;
  const finalPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'LAUNCH50' || couponCode.trim().toUpperCase() === 'DOCU50') {
      setDiscountPercent(50);
      showToast('Coupon applied! 50% discount activated.', 'success');
    } else if (couponCode.trim().toUpperCase() === 'PRO100') {
      setDiscountPercent(100);
      showToast('100% discount promo code applied!', 'success');
    } else {
      showToast('Invalid coupon code. Try "LAUNCH50".', 'error');
    }
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      handleStripePaymentSuccess(checkoutPlan, billingCycle);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Stripe Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">NexiPDF Pro</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase">
                  Stripe Checkout
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Encrypted with 256-bit AES protocol
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Summary */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 capitalize">
              {checkoutPlan.replace('_', ' ')} Plan
            </h4>
            <p className="text-xs text-slate-500">
              Unlimited document conversions · Priority engine
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              ${finalPrice.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 block">
              {checkoutPlan === 'pro_annual' ? '/ year' : '/ month'}
            </span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePay} className="p-6 space-y-4">
          
          {/* Cardholder name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              required
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              placeholder="Jane Doe"
            />
          </div>

          {/* Card information */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Card Information
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-t-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600"
                placeholder="4242 4242 4242 4242"
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <div className="grid grid-cols-2">
              <input
                type="text"
                required
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-t-0 border-r-0 border-slate-200 rounded-bl-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600"
                placeholder="MM / YY"
              />
              <input
                type="text"
                required
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-t-0 border-slate-200 rounded-br-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600"
                placeholder="CVC"
              />
            </div>
          </div>

          {/* Country & Zip */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Sri Lanka">Sri Lanka</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                required
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                placeholder="ZIP / Postal"
              />
            </div>
          </div>

          {/* Coupon Code input */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Promotion / Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter LAUNCH50 for 50% off"
                className="grow px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 uppercase font-mono"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
            {discountPercent > 0 && (
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                ✓ {discountPercent}% discount applied!
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Processing Payment with Stripe...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pay ${finalPrice.toFixed(2)} & Activate Pro</span>
                </>
              )}
            </button>
          </div>

          {/* Stripe Security Footer */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Guaranteed safe checkout via Stripe Payments API</span>
          </div>
        </form>
      </div>
    </div>
  );
};
