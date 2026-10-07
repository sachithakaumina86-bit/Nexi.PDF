import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ConversionRecord, ToolId, PlanType, StripeInvoice } from '../types';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  activeView: 'home' | 'tool' | 'dashboard' | 'pricing' | 'admin';
  setActiveView: (view: 'home' | 'tool' | 'dashboard' | 'pricing' | 'admin') => void;
  selectedToolId: ToolId | null;
  selectTool: (toolId: ToolId | null) => void;
  
  // Usage tracking
  dailyLimit: number;
  remainingDailyUses: number;
  isUsageLimitReached: boolean;
  recordConversionUsage: (record: Omit<ConversionRecord, 'id' | 'userId' | 'userEmail' | 'timestamp'>) => ConversionRecord;
  resetDailyUsage: () => void;
  
  // History & Stats
  conversions: ConversionRecord[];
  invoices: StripeInvoice[];
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  
  // Modals & UI
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  isAdminLoginModalOpen: boolean;
  setIsAdminLoginModalOpen: (open: boolean) => void;
  checkoutPlan: PlanType;
  openCheckout: (plan: PlanType) => void;
  handleStripePaymentSuccess: (plan: PlanType, billingCycle: 'monthly' | 'annual') => void;
  
  // Admin Authentication
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
  
  // Reset all application data (factory reset)
  resetAllData: () => void;
  
  // Role switcher helper for testing all flows
  switchUserRole: (role: 'user' | 'pro' | 'admin', forceUsage?: number) => void;
  
  // Notifications
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const ADMIN_CREDENTIALS = {
  email: 'LakNexus@design.co',
  password: 'Admin@Nexi2026!',
};

const DAILY_FREE_LIMIT = 3;

// Fresh initial user database for application
const INITIAL_USERS: User[] = [
  {
    id: 'usr_current',
    name: 'Standard User',
    email: 'user@nexipdf.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    role: 'user',
    plan: 'free',
    subscriptionStatus: 'none',
    createdAt: '2026-10-07',
    dailyConversionsCount: 0,
    lastConversionDate: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'usr_admin',
    name: 'LakNexus',
    email: 'LakNexus@design.co',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    role: 'admin',
    plan: 'enterprise',
    subscriptionStatus: 'active',
    subscriptionPeriodEnd: '2028-12-31',
    createdAt: '2026-10-07',
    dailyConversionsCount: 0,
    lastConversionDate: new Date().toISOString().slice(0, 10),
  },
];

const INITIAL_INVOICES: StripeInvoice[] = [];

const INITIAL_CONVERSIONS: ConversionRecord[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const APP_VERSION_KEY = 'docuforge_data_v2_fresh';

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    // If user requested fresh application reset or version changed, start clean
    if (!localStorage.getItem(APP_VERSION_KEY)) {
      localStorage.removeItem('docuforge_users');
      localStorage.removeItem('docuforge_current_user');
      localStorage.removeItem('docuforge_conversions');
      localStorage.removeItem('docuforge_invoices');
      localStorage.setItem(APP_VERSION_KEY, 'true');
      return INITIAL_USERS;
    }

    const saved = localStorage.getItem('docuforge_users');
    if (saved) {
      try {
        const users: User[] = JSON.parse(saved);
        return users.map((u) => {
          if (
            u.email?.toLowerCase() === 'david@archidesign.co' ||
            u.name === 'David Kim' ||
            u.id === 'usr_4' ||
            (u.role === 'admin' && (u.email === 'admin@nexipdf.com' || u.name === 'NexiPDF Master Admin'))
          ) {
            return {
              ...u,
              name: 'LakNexus',
              email: 'LakNexus@design.co',
            };
          }
          return u;
        });
      } catch (e) { /* ignore */ }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('docuforge_current_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (
          u.email?.toLowerCase() === 'david@archidesign.co' ||
          u.name === 'David Kim' ||
          (u.role === 'admin' && (u.email === 'admin@nexipdf.com' || u.name === 'NexiPDF Master Admin'))
        ) {
          u.name = 'LakNexus';
          u.email = 'LakNexus@design.co';
        }
        // check if today is a different date, reset daily usage
        const today = new Date().toISOString().slice(0, 10);
        if (u.lastConversionDate !== today) {
          u.dailyConversionsCount = 0;
          u.lastConversionDate = today;
        }
        return u;
      } catch (e) { /* ignore */ }
    }
    return allUsers[0];
  });

  const [activeView, setActiveView] = useState<'home' | 'tool' | 'dashboard' | 'pricing' | 'admin'>('home');
  const [selectedToolId, setSelectedToolId] = useState<ToolId | null>(null);

  const [conversions, setConversions] = useState<ConversionRecord[]>(() => {
    const saved = localStorage.getItem('docuforge_conversions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CONVERSIONS;
  });

  const [invoices, setInvoices] = useState<StripeInvoice[]>(() => {
    const saved = localStorage.getItem('docuforge_invoices');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_INVOICES;
  });

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanType>('pro_monthly');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('docuforge_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('docuforge_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('docuforge_conversions', JSON.stringify(conversions));
  }, [conversions]);

  useEffect(() => {
    localStorage.setItem('docuforge_invoices', JSON.stringify(invoices));
  }, [invoices]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const selectTool = (toolId: ToolId | null) => {
    setSelectedToolId(toolId);
    if (toolId) {
      setActiveView('tool');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const dailyLimit = DAILY_FREE_LIMIT;
  const isProOrAdmin = currentUser.role === 'pro' || currentUser.role === 'admin' || currentUser.plan !== 'free';
  const remainingDailyUses = isProOrAdmin ? 999999 : Math.max(0, dailyLimit - currentUser.dailyConversionsCount);
  const isUsageLimitReached = !isProOrAdmin && currentUser.dailyConversionsCount >= dailyLimit;

  const recordConversionUsage = (
    record: Omit<ConversionRecord, 'id' | 'userId' | 'userEmail' | 'timestamp'>
  ): ConversionRecord => {
    const newCount = currentUser.dailyConversionsCount + 1;
    const today = new Date().toISOString().slice(0, 10);

    const fullRecord: ConversionRecord = {
      ...record,
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      timestamp: new Date().toISOString(),
    };

    setCurrentUser((prev) => ({
      ...prev,
      dailyConversionsCount: newCount,
      lastConversionDate: today,
    }));

    setConversions((prev) => [fullRecord, ...prev]);

    // Update in allUsers list
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? { ...u, dailyConversionsCount: newCount, lastConversionDate: today }
          : u
      )
    );

    return fullRecord;
  };

  const resetDailyUsage = () => {
    const today = new Date().toISOString().slice(0, 10);
    setCurrentUser((prev) => ({
      ...prev,
      dailyConversionsCount: 0,
      lastConversionDate: today,
    }));
    setAllUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, dailyConversionsCount: 0 } : u))
    );
    showToast('Daily conversion quota reset to 3 free uses!', 'info');
  };

  const openCheckout = (plan: PlanType) => {
    setCheckoutPlan(plan);
    setIsUpgradeModalOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleStripePaymentSuccess = (plan: PlanType, billingCycle: 'monthly' | 'annual') => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + (billingCycle === 'annual' ? 1 : 0));
    if (billingCycle === 'monthly') nextYear.setMonth(nextYear.getMonth() + 1);

    const price = plan === 'pro_annual' ? 79 : plan === 'enterprise' ? 29 : 9;

    const newInvoice: StripeInvoice = {
      id: `in_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      amount: price,
      planName: `NexiPDF Pro (${billingCycle === 'annual' ? 'Annual' : 'Monthly'})`,
      status: 'paid',
      paymentMethod: '•••• 4242',
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    setCurrentUser((prev) => ({
      ...prev,
      role: 'pro',
      plan: plan,
      subscriptionStatus: 'active',
      subscriptionPeriodEnd: nextYear.toISOString().slice(0, 10),
      stripeCustomerId: `cus_${Math.random().toString(36).substring(2, 10)}`,
    }));

    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              role: 'pro',
              plan: plan,
              subscriptionStatus: 'active',
              subscriptionPeriodEnd: nextYear.toISOString().slice(0, 10),
            }
          : u
      )
    );

    setIsCheckoutModalOpen(false);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) { /* ignore */ }

    showToast('Payment successful! Welcome to NexiPDF Pro with unlimited access.', 'success');
  };

  const loginAdmin = (email: string, pass: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    const validEmails = [
      ADMIN_CREDENTIALS.email.toLowerCase(),
      'laknexus@design.co',
      'david@archidesign.co',
      'admin@nexipdf.com',
    ];
    if (validEmails.includes(cleanEmail) && pass === ADMIN_CREDENTIALS.password) {
      const adminAcc =
        allUsers.find((u) => u.email.toLowerCase() === 'laknexus@design.co') ||
        allUsers.find((u) => u.role === 'admin') ||
        INITIAL_USERS[1];
      setCurrentUser(adminAcc);
      setActiveView('admin');
      setIsAdminLoginModalOpen(false);
      showToast('Successfully authenticated as Administrator', 'success');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    const regularUser = allUsers.find((u) => u.role === 'user') || INITIAL_USERS[0];
    setCurrentUser(regularUser);
    setActiveView('home');
    showToast('Admin session ended. Returned to standard user.', 'info');
  };

  const resetAllData = () => {
    localStorage.removeItem('docuforge_users');
    localStorage.removeItem('docuforge_current_user');
    localStorage.removeItem('docuforge_conversions');
    localStorage.removeItem('docuforge_invoices');
    localStorage.setItem(APP_VERSION_KEY, 'true');

    setAllUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setConversions([]);
    setInvoices([]);
    setActiveView('home');
    showToast('All application data and dashboards have been completely reset.', 'success');
  };

  const switchUserRole = (role: 'user' | 'pro' | 'admin', forceUsage?: number) => {
    setCurrentUser((prev) => {
      const updated: User = {
        ...prev,
        role,
        plan: role === 'user' ? 'free' : role === 'admin' ? 'enterprise' : 'pro_monthly',
        subscriptionStatus: role === 'user' ? 'none' : 'active',
        dailyConversionsCount: forceUsage !== undefined ? forceUsage : role === 'user' ? 2 : prev.dailyConversionsCount,
      };
      return updated;
    });
    showToast(`Switched view to ${role.toUpperCase()} mode`, 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeView,
        setActiveView,
        selectedToolId,
        selectTool,
        dailyLimit,
        remainingDailyUses,
        isUsageLimitReached,
        recordConversionUsage,
        resetDailyUsage,
        conversions,
        invoices,
        allUsers,
        setAllUsers,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        isAdminLoginModalOpen,
        setIsAdminLoginModalOpen,
        checkoutPlan,
        openCheckout,
        handleStripePaymentSuccess,
        loginAdmin,
        logoutAdmin,
        resetAllData,
        switchUserRole,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
