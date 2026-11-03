import React, { createContext, useContext, useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Check, X, ShieldCheck, Sparkles } from 'lucide-react';

const PwaContext = createContext();

export function PwaProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / in standalone mode
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');
      setIsInstalled(Boolean(isStandalone));
    };
    checkStandalone();

    // 2. Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // If deferredPrompt is not yet available, show the interactive Chrome install visual guide
      setShowGuideModal(true);
    }
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt),
        isInstalled,
        installApp,
        showGuideModal,
        setShowGuideModal
      }}
    >
      {children}
      {showGuideModal && <InstallGuideModal onClose={() => setShowGuideModal(false)} />}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    return {
      isInstallable: false,
      isInstalled: false,
      installApp: () => {},
      showGuideModal: false,
      setShowGuideModal: () => {}
    };
  }
  return context;
}

function InstallGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
            <img src="./id_assets/bsskn_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>BSSKN ERP Chrome App</span>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold">
                ಡೆಸ್ಕ್‌ಟಾಪ್ ಆ್ಯಪ್
              </span>
            </h3>
            <p className="text-xs text-slate-400">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
          <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>ಕ್ರೋಮ್ ಆ್ಯಪ್ ಪ್ರಯೋಜನಗಳು (Chrome App Benefits):</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-300 pl-1">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>ಡೆಸ್ಕ್‌ಟಾಪ್ / ಲ್ಯಾಪ್ಟಾಪ್‌ನಲ್ಲಿ ನೇರ ಅಪ್ಲಿಕೇಶನ್‌ನಂತೆ ತೆರೆಯುತ್ತದೆ (No browser address bar).</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>ಡೆಸ್ಕ್‌ಟಾಪ್ ಶಾರ್ಟ್‌ಕಟ್ ಮತ್ತು ಟಾಸ್ಕ್‌ಬಾರ್‌ನಲ್ಲಿ ಐಕಾನ್ ಲಭ್ಯವಿರುತ್ತದೆ.</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>ಅತಿ ವೇಗವಾದ ರಿಯಲ್-ಟೈಮ್ ಕ್ಲೌಡ್ ಸಿಂಕ್ ಮತ್ತು ಆಫ್‌ಲೈನ್ ಕ್ಯಾಶಿಂಗ್.</span>
            </li>
          </ul>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200">
            ಗೂಗಲ್ ಕ್ರೋಮ್‌ನಲ್ಲಿ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡುವ ವಿಧಾನ (Installation Steps):
          </h4>

          {/* Desktop Step */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-slate-200">ವಿಧಾನ 1: ಕ್ರೋಮ್ ಅಡ್ರೆಸ್ ಬಾರ್ (Address Bar) ಮೂಲಕ</div>
              <p className="text-slate-400 text-[11px]">
                ಬ್ರೌಸರ್‌ನ ಮೇಲ್ಭಾಗದಲ್ಲಿ ಲಿಂಕ್ (URL) ಇರುವ ಜಾಗದ ಬಲತುದಿಯಲ್ಲಿ ಕಾಣುವ 
                <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                  <Download className="w-3 h-3 inline mr-1" /> ಇನ್‌ಸ್ಟಾಲ್ (Install)
                </span>
                ಐಕಾನ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.
              </p>
            </div>
          </div>

          {/* Menu Step */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-slate-200">ವಿಧಾನ 2: ಕ್ರೋಮ್ ಮೆನು (Chrome Menu) ಮೂಲಕ</div>
              <p className="text-slate-400 text-[11px]">
                ಬ್ರೌಸರ್‌ನ ಬಲತುದಿಯ ಮೂರು ಚುಕ್ಕೆಗಳ <strong className="text-slate-200">⋮ (Menu)</strong> ಕ್ಲಿಕ್ ಮಾಡಿ ➔ 
                <strong className="text-slate-200"> "Save and share" (ಅಥವಾ "Cast, save, and share")</strong> ➔ 
                <strong className="text-emerald-400"> "Install page as app..." / "Install BSSKN ERP..."</strong> ಆಯ್ಕೆಮಾಡಿ.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            ಸರಿ, ಅರ್ಥವಾಯಿತು (Got It)
          </button>
        </div>
      </div>
    </div>
  );
}
