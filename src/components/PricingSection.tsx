import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Sparkles, Shield, Zap, Lock, HelpCircle } from 'lucide-react';

export const PricingSection: React.FC = () => {
  const { openCheckout, currentUser } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const isPro = currentUser.role === 'pro' || currentUser.role === 'admin' || currentUser.plan !== 'free';

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-semibold tracking-wider uppercase text-indigo-600 block mb-2">
          Transparent, Predictable Pricing
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Start free, upgrade for limitless document workflows
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600">
          Try any tool 3 times every day completely free. Need unlimited batch processing, larger files, and zero limits? Upgrade in seconds with Stripe.
        </p>

        {/* Billing cycle toggle */}
        <div className="mt-8 inline-flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Save 27%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
        
        {/* Tier 1: Free Starter */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                For casual individual tasks
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Free Starter</h3>
              <p className="text-xs text-slate-500 mt-1">
                Zero sign-up required. Enjoy essential document conversions daily.
              </p>
            </div>

            <div className="my-6">
              <span className="text-4xl font-extrabold text-slate-900 tabular-nums">$0</span>
              <span className="text-xs text-slate-500 ml-1.5">/ forever</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>3 conversions per day</strong> across all tools</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Max 50 MB per document</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Merge up to 5 PDFs per run</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Standard client-side processing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero file storage / private session</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              disabled={currentUser.plan === 'free'}
              className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 disabled:opacity-50 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center block"
            >
              {currentUser.plan === 'free' ? 'Current Active Tier' : 'Downgrade to Free'}
            </button>
          </div>
        </div>

        {/* Tier 2: Pro (Highlighted) */}
        <div className="bg-white rounded-2xl border-2 border-indigo-600 p-6 flex flex-col justify-between shadow-lg relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white rounded-full text-[11px] font-bold tracking-wide">
            RECOMMENDED FOR PROFESSIONALS
          </div>

          <div>
            <div className="mb-4">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">
                For freelancers & growing teams
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">NexiPDF Pro</h3>
              <p className="text-xs text-slate-500 mt-1">
                Unlimited speed, zero daily limits, and massive 2GB file allowance.
              </p>
            </div>

            <div className="my-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900 tabular-nums">
                  {billingCycle === 'annual' ? '$79' : '$9'}
                </span>
                <span className="text-xs text-slate-500 ml-1.5">
                  {billingCycle === 'annual' ? '/ year ($6.58/mo)' : '/ month'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                {billingCycle === 'annual' ? 'Billed annually · Save $29 every year' : 'Billed monthly · Cancel anytime'}
              </p>
            </div>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0 font-bold" />
                <span><strong>Unlimited conversions 24/7</strong> (no daily caps)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span><strong>2,048 MB (2 GB)</strong> maximum file size</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Unlimited batch merging & image bundles</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Dedicated CPU multi-core WebAssembly pipeline</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Instant automated Stripe invoices & receipts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Priority customer support SLA</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              onClick={() => openCheckout(billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly')}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center block"
            >
              {isPro ? 'Manage Pro Plan' : 'Get Started with Pro'}
            </button>
          </div>
        </div>

        {/* Tier 3: Team / Enterprise */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                For organizations & agencies
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Enterprise Suite</h3>
              <p className="text-xs text-slate-500 mt-1">
                Custom document automation, API access, and SSO user provisioning.
              </p>
            </div>

            <div className="my-6">
              <span className="text-4xl font-extrabold text-slate-900 tabular-nums">$29</span>
              <span className="text-xs text-slate-500 ml-1.5">/ user / month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Everything included in NexiPDF Pro</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-seat team workspace with role management</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>REST API access & batch webhooks</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dedicated account manager & phone SLA</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom legal DPA & BAA agreements</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              onClick={() => openCheckout('enterprise')}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center block"
            >
              Contact Sales / Deploy
            </button>
          </div>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 max-w-5xl mx-auto shadow-xs mb-16">
        <h3 className="text-lg font-bold text-slate-900 mb-6 text-center">
          Detailed Feature Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 px-4 font-semibold">Capability</th>
                <th className="py-3 px-4 font-semibold">Free Starter</th>
                <th className="py-3 px-4 font-semibold text-indigo-600">NexiPDF Pro</th>
                <th className="py-3 px-4 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-medium">Daily Conversion Limit</td>
                <td className="py-3 px-4">3 files / day</td>
                <td className="py-3 px-4 font-semibold text-indigo-700">Unlimited</td>
                <td className="py-3 px-4 font-semibold">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Max Upload Size</td>
                <td className="py-3 px-4">50 MB</td>
                <td className="py-3 px-4 font-semibold text-indigo-700">2,048 MB (2 GB)</td>
                <td className="py-3 px-4 font-semibold">5,120 MB (5 GB)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Batch Operations</td>
                <td className="py-3 px-4">Up to 3 files</td>
                <td className="py-3 px-4 font-semibold text-indigo-700">Up to 100 files</td>
                <td className="py-3 px-4 font-semibold">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Watermark on Output</td>
                <td className="py-3 px-4">Never (Clean)</td>
                <td className="py-3 px-4 font-semibold text-indigo-700">Never (Clean)</td>
                <td className="py-3 px-4 font-semibold">Never (Clean)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Processing Priority</td>
                <td className="py-3 px-4">Standard queue</td>
                <td className="py-3 px-4 font-semibold text-indigo-700">Instant multi-thread</td>
                <td className="py-3 px-4 font-semibold">Dedicated node</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Payment & Receipts</td>
                <td className="py-3 px-4">—</td>
                <td className="py-3 px-4 font-semibold text-indigo-700">Instant PDF Invoices</td>
                <td className="py-3 px-4 font-semibold">Invoicing & Wire</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-slate-900 text-center mb-6">
          Frequently Asked Questions
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200/80 rounded-xl">
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              How does the 3 free conversions per day limit work?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every guest or free user gets 3 free document actions every 24 hours (resetting automatically at midnight UTC). You can use any of our 8 tools. Once you have completed 3 conversions, you can upgrade to Pro for unlimited usage.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-xl">
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              Are my confidential documents safe and private?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Yes, completely. Unlike other services, NexiPDF uses browser-native WebAssembly to process PDF and image conversions client-side. Your files never leave your computer or get saved onto remote servers.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-xl">
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              Can I cancel my Pro subscription at any time?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Yes. You can cancel with a single click inside your User Dashboard or Stripe Customer Portal. You will retain access until the end of your billing cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
