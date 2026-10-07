/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ToolGrid } from './components/ToolGrid';
import { ToolWorkspace } from './components/ToolWorkspace';
import { UserDashboard } from './components/UserDashboard';
import { PricingSection } from './components/PricingSection';
import { AdminPanel } from './components/AdminPanel';
import { StripeCheckoutModal } from './components/StripeCheckoutModal';
import { UpgradeModal } from './components/UpgradeModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';

const AppContent: React.FC = () => {
  const { activeView, selectedToolId } = useApp();

  // Inject SEO JSON-LD structured data for SaaS Document Suite
  useEffect(() => {
    const scriptId = 'nexipdf-json-ld';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'NexiPDF',
        'operatingSystem': 'Any',
        'applicationCategory': 'UtilitiesApplication',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
          'description': '3 free daily conversions, Pro plan available for $9/month',
        },
        'featureList': [
          'Merge PDF',
          'Split PDF',
          'Compress PDF',
          'PDF to Image',
          'Image to PDF',
          'PDF to Word',
          'Word to PDF',
          'Image Format Converter',
        ],
      });
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900">
      <Navbar />

      <main className="grow">
        {activeView === 'home' && <ToolGrid />}
        {activeView === 'tool' && selectedToolId && <ToolWorkspace toolId={selectedToolId} />}
        {activeView === 'dashboard' && <UserDashboard />}
        {activeView === 'pricing' && <PricingSection />}
        {activeView === 'admin' && <AdminPanel />}
      </main>

      <Footer />

      {/* Global Modals & Notifications */}
      <StripeCheckoutModal />
      <UpgradeModal />
      <AdminLoginModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
