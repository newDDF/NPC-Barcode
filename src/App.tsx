import ToastViewport from './components/ToastViewport';
import { lazy, Suspense, useEffect, useState } from 'react';

const SingleGenerator = lazy(() => import('./features/single/SingleGenerator'));
const ApiMockBuilder = lazy(() => import('./features/api/ApiMockBuilder'));
const BatchProcessor = lazy(() => import('./features/batch/BatchProcessor'));
import { BarcodeConfigProvider } from './features/shared/BarcodeConfigContext';
import LegalModal, { type LegalDocument } from './components/LegalModal';
import SeoContent from './components/SeoContent';

type View = 'single' | 'batch' | 'api';
type Theme = 'dark' | 'light';

const navigation: { id: View; label: string; icon: string }[] = [
  { id: 'single', label: 'Single Barcode', icon: 'fa-qrcode' },
  { id: 'batch', label: 'Batch Processing', icon: 'fa-layer-group' },
  { id: 'api', label: 'API Mock Generator', icon: 'fa-code' },
];

function App() {
  const [activeView, setActiveView] = useState<View>(() => {
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path === '/barcode-api') return 'api';
    if (path === '/batch-barcode-generator') return 'batch';
    return 'single';
  });
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem('npc_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');

    try {
      localStorage.setItem('npc_theme', theme);
    } catch {
      // Theme remains available for the current session.
    }
  }, [theme]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 min-w-0 items-center justify-between gap-2 sm:gap-3">
            <a href="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
                  <rect fill="#ffdd00" x="-.26" y="-.73" width="120" height="120" rx="30.16" ry="30.16" />
                  <g fill="#ffffff">
                    <polygon points="49.26 75.82 34.04 84.6 34.04 74.38 20.83 92.11 34.49 100 51.33 90.28 62.29 36.46 49.26 53.95 49.26 75.82" />
                    <polygon points="89.16 78.03 89.16 85.41 77.67 78.81 77.67 62.68 67.96 49.72 67.96 84.38 98.26 90.18 95.21 86.11 89.16 78.03" />
                    <polygon points="89.16 47.55 89.16 76.53 95.99 85.66 98.5 89.01 88.39 36.74 68.17 48.51 77.67 61.18 77.67 54.24 89.16 47.55" />
                    <polygon points="98.04 91.05 70.05 85.69 88.71 96.41 98.04 91.05" />
                    <polygon points="98.86 86.17 98.86 42.39 96.37 40.96 89.34 36.91 98.86 86.17" />
                    <polygon points="20.61 87.56 33.86 18.71 20.61 26.36 20.61 87.56" />
                    <polygon points="34.04 72.88 34.04 33.74 49.26 42.64 49.26 52.46 55.17 44.52 62.47 34.72 34.81 18.54 20.97 90.42 34.04 72.88" />
                    <polygon points="62.68 39.03 52.38 89.62 62.68 83.64 62.68 39.03" />
                  </g>
                </svg>
              </div>
              <span className="brand-wordmark inline whitespace-nowrap text-sm font-bold tracking-tight sm:text-xl">
                NPC-Barcode
              </span>
            </a>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 sm:gap-3">
              <nav
                className="flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950/80 sm:gap-1"
                aria-label="Main navigation"
              >
                {navigation.map((item) => {
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveView(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm lg:px-4 ${
                        isActive
                          ? 'bg-brand text-slate-950 shadow'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                      <span className="hidden lg:inline whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle light and dark theme"
                title="Toggle Light/Dark Theme"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-brand/40 bg-slate-900 text-brand shadow-sm hover:border-brand hover:bg-slate-800'
                    : 'border-brand/40 bg-brand/10 text-[#665800] shadow-sm hover:border-brand hover:bg-brand/20'
                }`}
              >
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-base`} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <BarcodeConfigProvider>
        <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex min-h-[320px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-[#ffdd00]" />
              </div>
            }
          >
            {activeView === 'single' && <SingleGenerator />}
            {activeView === 'batch' && <BatchProcessor />}
            {activeView === 'api' && <ApiMockBuilder />}
          </Suspense>
        </main>
      </BarcodeConfigProvider>

      <SeoContent />

      <footer className="mt-12 border-t border-slate-200 bg-white/80 py-5 text-xs text-slate-500 transition-colors dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 whitespace-nowrap px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-bold text-slate-700 dark:text-slate-300">NPC-Barcode</span>
            <span className="truncate">© 2026 NPC Toolkits.</span>
          </div>
          <nav aria-label="Legal and project links" className="flex shrink-0 items-center gap-3 sm:gap-5">
            <button type="button" onClick={() => setLegalDocument('privacy')} className="inline-flex items-center gap-1.5 transition hover:text-slate-900 dark:hover:text-white">
              <i className="fa-solid fa-shield-halved" aria-hidden="true" />
              <span>Privacy Policy</span>
            </button>
            <button type="button" onClick={() => setLegalDocument('terms')} className="inline-flex items-center gap-1.5 transition hover:text-slate-900 dark:hover:text-white">
              <i className="fa-solid fa-file-contract" aria-hidden="true" />
              <span>Terms of Use</span>
            </button>
            <a href="https://github.com/newDDF/npc-barcode" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-slate-900 dark:hover:text-white">
              <i className="fa-brands fa-github" aria-hidden="true" />
              <span>GitHub</span>
            </a>
          </nav>
        </div>
      </footer>
      <ToastViewport />

      {legalDocument && (
        <LegalModal document={legalDocument} onClose={() => setLegalDocument(null)} />
      )}
    </div>
  );
}

export default App;
