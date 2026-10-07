import React, { useState } from 'react';
import { TOOLS_CONFIG } from '../data/toolsData';
import { useApp } from '../context/AppContext';
import { ToolMeta } from '../types';
import { 
  Layers, 
  Scissors, 
  Minimize2, 
  Image, 
  FilePlus, 
  FileText, 
  FileCheck, 
  RefreshCw, 
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Cpu
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Layers: <Layers className="w-5 h-5" />,
  Scissors: <Scissors className="w-5 h-5" />,
  Minimize2: <Minimize2 className="w-5 h-5" />,
  Image: <Image className="w-5 h-5" />,
  FilePlus: <FilePlus className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  FileCheck: <FileCheck className="w-5 h-5" />,
  RefreshCw: <RefreshCw className="w-5 h-5" />,
};

export const ToolGrid: React.FC = () => {
  const { selectTool, openCheckout, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'pdf' | 'convert' | 'image'>('all');

  const filteredTools = TOOLS_CONFIG.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-linear-to-b from-white via-slate-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100/80 rounded-full text-xs font-semibold text-indigo-700 mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Browser-Native Document Engine · 3 Free Daily Uses</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Every tool you need to work with <span className="text-indigo-600">PDFs and images</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Merge, split, compress, and convert documents in seconds. 100% private in-browser processing with zero server retention and enterprise-grade vector clarity.
          </p>

          {/* Quick metric highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Sub-second execution</span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Client-side privacy guarantee</span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Zero quality degradation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All 8 Tools' },
              { id: 'pdf', label: 'PDF Essentials' },
              { id: 'convert', label: 'Document Converters' },
              { id: 'image', label: 'Image Formats' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools (e.g. compress, word)..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Tool Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredTools.map((tool: ToolMeta) => (
            <div
              key={tool.id}
              onClick={() => selectTool(tool.id)}
              className="group relative bg-white border border-slate-200/90 hover:border-indigo-500/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Top header inside card */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/70 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                    {ICON_MAP[tool.icon] || <FileText className="w-5 h-5" />}
                  </div>
                  {tool.badge && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {tool.title}
                </h3>

                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {tool.shortDescription}
                </p>
              </div>

              {/* Bottom metadata */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[140px]">
                  {tool.acceptedFormats.join(' · ')}
                </span>
                <span className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-800">No tools found matching "{searchQuery}"</p>
            <p className="text-xs text-slate-500 mt-1">Try searching for merge, compress, image, or docx.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
              }}
              className="mt-3 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Free Limit vs Pro Callout Banner */}
      {currentUser.role === 'user' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-lg">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300 mb-4">
                <span>Free Plan Limit: 3 Conversions Per Day</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Need unlimited conversions with zero waiting?
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Upgrade to NexiPDF Pro for unlimited daily files, max 2GB file sizes, parallel batch processing, and dedicated high-priority CPU bandwidth.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => openCheckout('pro_monthly')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Upgrade to Pro ($9/mo)
                </button>
                <div className="text-xs text-slate-400">
                  <span>Cancel anytime · 7-day money back guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enterprise Security Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8">
          <div className="max-w-3xl mb-8">
            <h2 className="text-xl font-bold text-slate-900">
              Built for speed, engineered for privacy
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Unlike traditional legacy platforms that upload your sensitive documents to untrusted remote cloud servers, NexiPDF runs its core rasterization and parsing pipeline directly inside your browser sandbox.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60">
              <ShieldCheck className="w-5 h-5 text-indigo-600 mb-2" />
              <h4 className="text-sm font-semibold text-slate-900 mb-1">End-to-End Local Execution</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your invoices, tax documents, and confidential reports never leave your device. Processing happens inside WebAssembly & Web Workers.
              </p>
            </div>
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60">
              <Lock className="w-5 h-5 text-emerald-600 mb-2" />
              <h4 className="text-sm font-semibold text-slate-900 mb-1">GDPR & ISO Compliant</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complies with strict European and international data handling policies. Zero third-party telemetry or document tracking.
              </p>
            </div>
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/60">
              <Zap className="w-5 h-5 text-amber-500 mb-2" />
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Instant Results</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                No queuing, no slow server upload waits, and no network bandwidth bottlenecks. Instant downloads as soon as files are dropped.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
