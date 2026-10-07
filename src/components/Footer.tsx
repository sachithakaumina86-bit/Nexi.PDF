import React from 'react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { selectTool, setActiveView, currentUser, setIsAdminLoginModalOpen } = useApp();

  return (
    <footer className="bg-white border-t border-slate-200/80 text-xs text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                N
              </div>
              <span className="font-bold text-slate-900 tracking-tight">NexiPDF</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              High-performance browser-native document & image transformation suite. Zero file retention.
            </p>
          </div>

          {/* Col 2: Popular Tools */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs">Popular Tools</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  onClick={() => selectTool('merge-pdf')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => selectTool('compress-pdf')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Compress PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => selectTool('split-pdf')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Split PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => selectTool('pdf-to-img')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  PDF to Image
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Converters */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs">Document Converters</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  onClick={() => selectTool('img-to-pdf')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Image to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => selectTool('pdf-to-word')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  PDF to Word
                </button>
              </li>
              <li>
                <button
                  onClick={() => selectTool('word-to-pdf')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Word to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => selectTool('image-convert')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Image Format Converter
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Support */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs">Product & Company</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  onClick={() => setActiveView('pricing')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Pricing Plans
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  User Dashboard
                </button>
              </li>
              {currentUser.role === 'admin' && (
                <li>
                  <button
                    onClick={() => setActiveView('admin')}
                    className="hover:text-indigo-600 transition-colors cursor-pointer font-medium text-indigo-600"
                  >
                    Admin Console
                  </button>
                </li>
              )}
              <li>
                <span className="text-slate-400">SOC-2 Type II Certified</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} NexiPDF Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-600 cursor-pointer">Security Whitepaper</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
