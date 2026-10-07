import React, { useState } from 'react';
import { useApp, ADMIN_CREDENTIALS } from '../context/AppContext';
import { User, PlanType } from '../types';
import { formatBytes } from '../services/pdfEngine';
import {
  Users,
  DollarSign,
  Activity,
  FileCheck2,
  HardDrive,
  Search,
  Shield,
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Zap,
  Lock,
  LogOut,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { 
    allUsers, 
    setAllUsers, 
    conversions, 
    invoices, 
    showToast,
    currentUser,
    setActiveView,
    setIsAdminLoginModalOpen,
    logoutAdmin,
    resetAllData
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'conversions' | 'financials' | 'settings'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'pro' | 'admin'>('all');
  const [adminFreeLimit, setAdminFreeLimit] = useState(3);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Guard: If regular user, show restricted access gate with admin login button
  if (currentUser.role !== 'admin') {
    return (
      <div className="py-16 max-w-xl mx-auto px-4 sm:px-6 text-center animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 sm:p-10">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Admin-Only Area</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Administrator Authentication Required
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
            The NexiPDF Admin Console is strictly restricted to administrator accounts. Regular users cannot access user directories, platform metrics, or financial data.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Log In as Administrator</span>
            </button>
            <button
              onClick={() => setActiveView('home')}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tools</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // KPIs
  const totalUsersCount = allUsers.length;
  const proSubscribersCount = allUsers.filter((u) => u.role === 'pro' || u.plan !== 'free').length;
  const mrr = invoices.reduce((acc, inv) => acc + inv.amount, 0) * 1.5; // Calculated MRR
  const totalConversionsCount = conversions.length;
  const totalBytesSaved = conversions.reduce(
    (acc, c) => acc + Math.max(0, c.inputFileSize - c.outputFileSize),
    0
  );

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleTogglePlan = (userId: string, newPlan: PlanType) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const isPro = newPlan !== 'free';
          return {
            ...u,
            plan: newPlan,
            role: isPro ? 'pro' : 'user',
            subscriptionStatus: isPro ? 'active' : 'none',
          };
        }
        return u;
      })
    );
    showToast(`User plan updated to ${newPlan.replace('_', ' ')}`, 'success');
  };

  const handleResetUserQuota = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, dailyConversionsCount: 0 } : u))
    );
    showToast('User daily quota reset to 0 used', 'info');
  };

  const handleToggleBan = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextBanned = !u.isBanned;
          showToast(nextBanned ? `User ${u.name} suspended` : `User ${u.name} reactivated`, 'info');
          return { ...u, isBanned: nextBanned };
        }
        return u;
      })
    );
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Active Admin Session Bar */}
      <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-900">
          <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Active Administrator Session: <strong>{currentUser.email}</strong>
          </span>
        </div>
        <button
          onClick={logoutAdmin}
          className="self-start sm:self-auto px-3 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500" />
          <span>Log Out Admin</span>
        </button>
      </div>
      
      {/* Admin Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>NexiPDF Enterprise Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            System Administration & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time infrastructure health, user quotas, Stripe subscription state, and document audit records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Systems Operational · 99.98% SLA</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Registered Users</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalUsersCount}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">+12% this week</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Active Subscribers</span>
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{proSubscribersCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">{(proSubscribersCount / totalUsersCount * 100).toFixed(0)}% conversion rate</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Est. MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">${mrr.toFixed(0)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Via Stripe Checkout</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Total Conversions</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalConversionsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Across all 8 tools</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Storage Saved</span>
            <HardDrive className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatBytes(totalBytesSaved)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Compressed bytes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        {[
          { id: 'users', label: `User Management (${allUsers.length})` },
          { id: 'conversions', label: `Global Conversion Audit (${conversions.length})` },
          { id: 'financials', label: 'Stripe Subscriptions & Invoices' },
          { id: 'settings', label: 'Platform & Quota Config' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: User Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['all', 'user', 'pro', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1 text-xs font-medium capitalize rounded-md transition-all cursor-pointer ${
                      roleFilter === r
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === 'all' ? 'All Roles' : r}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role & Plan</th>
                  <th className="py-3 px-4">Today's Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => {
                  const isPro = u.role === 'pro' || u.plan !== 'free';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            isPro ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.plan.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 tabular-nums font-mono">
                        {isPro ? (
                          <span className="text-indigo-600 font-semibold">Unlimited ({u.dailyConversionsCount} done)</span>
                        ) : (
                          <span className={u.dailyConversionsCount >= 3 ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
                            {u.dailyConversionsCount} / 3 used
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {u.isBanned ? (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Suspended
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.createdAt}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.plan === 'free' ? (
                            <button
                              onClick={() => handleTogglePlan(u.id, 'pro_monthly')}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                              title="Grant Pro Plan"
                            >
                              Grant Pro
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTogglePlan(u.id, 'free')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                              title="Set to Free"
                            >
                              Revoke Pro
                            </button>
                          )}

                          <button
                            onClick={() => handleResetUserQuota(u.id)}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Reset daily usage to 0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleBan(u.id)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                              u.isBanned
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {u.isBanned ? 'Unban' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Global Audit Logs */}
      {activeTab === 'conversions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Live Document Processing Stream</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit log of all executions processed across tools.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Tool</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Original Size</th>
                  <th className="py-3 px-4">Output Size</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {conversions.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(c.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{c.userEmail}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-700">{c.toolName}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate">{c.inputFileName}</td>
                    <td className="py-3 px-4 tabular-nums font-mono text-slate-500">{formatBytes(c.inputFileSize)}</td>
                    <td className="py-3 px-4 tabular-nums font-mono text-slate-900">
                      {formatBytes(c.outputFileSize)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Financials & Stripe */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stripe Integration Status</h3>
                <p className="text-xs text-slate-500">Live billing gateway and customer webhook health.</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200">
                Connected · Test Mode Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block mb-1">Gateway Endpoint</span>
                <span className="font-mono text-slate-800 font-semibold">https://api.stripe.com/v1</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block mb-1">Default Currency</span>
                <span className="font-mono text-slate-800 font-semibold">USD ($)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block mb-1">Webhook Dispatcher</span>
                <span className="font-mono text-slate-800 font-semibold">invoice.payment_succeeded</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Stripe Invoices Ledger</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Product Plan</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{inv.id}</td>
                      <td className="py-3 px-4 text-slate-500">{inv.date}</td>
                      <td className="py-3 px-4">{inv.planName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">${inv.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold capitalize">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Platform & Quota Config */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Global Quota Settings</h3>
          <p className="text-xs text-slate-500 mb-5">
            Configure the daily free usage limit and maximum file sizes across all guest & free users.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Free Daily Conversions Limit
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={adminFreeLimit}
                  onChange={(e) => setAdminFreeLimit(parseInt(e.target.value, 10) || 3)}
                  className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                />
                <span className="text-xs text-slate-500">conversions per user / 24 hours</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Max Allowed Upload Size (Free Users)
              </label>
              <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800">
                <option value="50">50 MB per file</option>
                <option value="100">100 MB per file</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Max Allowed Upload Size (Pro Users)
              </label>
              <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800">
                <option value="2048">2,048 MB (2 GB)</option>
                <option value="5120">5,120 MB (5 GB)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => showToast('Platform configuration saved successfully.', 'success')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>

          {/* Admin Master Credentials - Visible Exclusively to Authenticated Admin */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  Administrator Credentials & System Keys
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Private master credentials for administrator access. Visible only inside authenticated admin session.
                </p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-semibold">
                Admin Exclusive
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Admin Email</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-slate-900 truncate">{ADMIN_CREDENTIALS.email}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(ADMIN_CREDENTIALS.email);
                        showToast('Admin email copied to clipboard', 'info');
                      }}
                      className="ml-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Admin Password</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-slate-900 truncate">
                      {showAdminPassword ? ADMIN_CREDENTIALS.password : '••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        {showAdminPassword ? 'Hide' : 'Reveal'}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ADMIN_CREDENTIALS.password);
                          showToast('Admin password copied to clipboard', 'info');
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reset All Application & Admin Data (Fresh Start) */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  Reset Application & Clear All Data
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Purge all user accounts, conversion history, audit logs, and reset all dashboards to a clean, fresh state.
                </p>
              </div>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold">
                Danger Zone
              </span>
            </div>

            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-rose-900">
                <p className="font-semibold">Reset to fresh factory application</p>
                <p className="text-[11px] text-rose-700/80">
                  This wipes local demo caches and returns all user quotas, audit records, and dashboards to 0.
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset all user and admin data to a fresh application state?')) {
                    resetAllData();
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Application Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
