import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Shield, 
  User as UserIcon, 
  ChevronDown, 
  CreditCard, 
  LogOut, 
  RotateCcw,
  Zap,
  Lock,
  ShieldAlert
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    activeView, 
    setActiveView, 
    selectTool, 
    dailyLimit, 
    remainingDailyUses, 
    switchUserRole,
    resetDailyUsage,
    openCheckout,
    setIsAdminLoginModalOpen,
    logoutAdmin
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isPro = currentUser.role === 'pro' || currentUser.role === 'admin' || currentUser.plan !== 'free';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark (Display face) */}
        <button
          onClick={() => {
            selectTool(null);
            setActiveView('home');
          }}
          className="flex items-center gap-2 group text-left cursor-pointer focus-visible:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
            N
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            NexiPDF
          </span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => {
              selectTool(null);
              setActiveView('home');
            }}
            className={`transition-colors cursor-pointer hover:text-slate-900 ${
              activeView === 'home' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            All Tools
          </button>

          <button
            onClick={() => {
              setActiveView('pricing');
            }}
            className={`transition-colors cursor-pointer hover:text-slate-900 ${
              activeView === 'pricing' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Pricing
          </button>

          <button
            onClick={() => {
              setActiveView('dashboard');
            }}
            className={`transition-colors cursor-pointer hover:text-slate-900 ${
              activeView === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            Dashboard
          </button>

          {/* Admin Panel Link: ONLY visible to authenticated admin accounts */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                setActiveView('admin');
              }}
              className={`transition-colors cursor-pointer flex items-center gap-1.5 hover:text-slate-900 ${
                activeView === 'admin' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Panel</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
            </button>
          )}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {/* Daily Quota Indicator */}
          {isPro ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Unlimited Access</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openCheckout('pro_monthly')}
                className="group flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                title="Click to upgrade"
              >
                <span className="text-slate-500">Daily:</span>
                <span className="tabular-nums font-semibold text-slate-900">
                  {dailyLimit - remainingDailyUses}/{dailyLimit} used
                </span>
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500 transition-transform group-hover:scale-110" />
              </button>

              <button
                onClick={() => openCheckout('pro_monthly')}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Upgrade to Pro</span>
              </button>
            </div>
          )}

          {/* User Account / Sign In / Admin Section */}
          {currentUser.role !== 'admin' ? (
            // For regular users: Only show the "Sign In" button (triggers admin sign in modal)
            <button
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer focus-visible:outline-none"
              title="Sign In"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign In</span>
            </button>
          ) : (
            // For Admin: Show Admin user profile menu with full controls
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg border border-indigo-200 hover:border-indigo-300 bg-indigo-50/70 hover:bg-indigo-50 text-indigo-900 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span className="max-w-[100px] truncate text-indigo-950 font-semibold">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-indigo-600 font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-indigo-100 rounded">
                  Admin
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
              </button>

              {/* Admin Dropdown Menu */}
              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Signed in as</p>
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">
                        Admin
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                      <span className="text-slate-500">Plan Status</span>
                      <span className="font-semibold capitalize text-indigo-600">
                        {currentUser.plan.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Demo Mode Switcher: visible only to Admin */}
                  <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Demo Mode Switcher:
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => {
                          switchUserRole('user', 1);
                          setIsUserMenuOpen(false);
                        }}
                        className="px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                      >
                        Free (1/3)
                      </button>
                      <button
                        onClick={() => {
                          switchUserRole('user', 3);
                          setIsUserMenuOpen(false);
                        }}
                        className="px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                        title="Test hitting the daily 3/3 conversion limit"
                      >
                        Limit (3/3)
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('admin');
                          setIsUserMenuOpen(false);
                        }}
                        className="px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 bg-indigo-600 text-white"
                        title="Active Admin Account"
                      >
                        <Shield className="w-2.5 h-2.5" />
                        <span>Admin</span>
                      </button>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveView('dashboard');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>My Dashboard & Files</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('pricing');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>Subscription & Billing</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('admin');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-indigo-700 font-semibold hover:bg-indigo-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Admin Portal (Console)</span>
                    </button>

                    <button
                      onClick={() => {
                        resetDailyUsage();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-400" />
                      <span>Reset Free Daily Quota</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logoutAdmin();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Sign Out from Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
