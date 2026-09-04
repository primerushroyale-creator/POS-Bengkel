'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, CheckCircle, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);
    setIsReady(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsStandalone(true);
      return true;
    }
    return false;
  };

  return {
    isReady,
    isStandalone,
    canInstall: !!deferredPrompt && !isStandalone,
    isIOS: isIOS && !isStandalone,
    installApp,
  };
}

/**
 * Custom Install Button for Navbar / Header
 */
export const NavbarInstallButton: React.FC = () => {
  const { isReady, isStandalone, canInstall, isIOS, installApp } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (!isReady || isStandalone) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      <button
        onClick={() => {
          if (canInstall) {
            installApp();
          } else if (isIOS) {
            setShowIOSModal(true);
          }
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 transition-all text-xs font-bold shrink-0 shadow-soft-sm"
        title="Install BengkelPOS ke Perangkat"
      >
        <Download className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
        <span className="hidden xs:inline">Install App</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <Modal
          isOpen={showIOSModal}
          onClose={() => setShowIOSModal(false)}
          title="Install BengkelPOS di iPhone / iPad"
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                BP
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">BengkelPOS PRO</h4>
                <p className="text-xs text-slate-500">Pasang di Layar Utama tanpa App Store</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold">Tap tombol Share di browser Safari</p>
                  <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                    Ikon kotak panah atas (<Share className="w-3.5 h-3.5 inline text-indigo-600" />) di menu bawah Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold">Pilih "Add to Home Screen"</p>
                  <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                    Gulir opsi ke bawah lalu pilih (<PlusSquare className="w-3.5 h-3.5 inline text-indigo-600" />) Tambah ke Layar Utama.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold">Tap "Add" di pojok kanan atas</p>
                  <p className="text-slate-500 mt-0.5">
                    Aplikasi BengkelPOS siap digunakan langsung dari layar utama layaknya aplikasi native!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-soft"
              >
                Mengerti
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

/**
 * Custom Install Banner / Card for Desktop Sidebar
 */
export const SidebarInstallBanner: React.FC = () => {
  const { isReady, isStandalone, canInstall, isIOS, installApp } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (!isReady || isStandalone) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl mb-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Install Aplikasi</h4>
            <p className="text-[10px] text-slate-500">Akses cepat &amp; mode offline</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (canInstall) {
              installApp();
            } else if (isIOS) {
              setShowIOSModal(true);
            }
          }}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-[11px] font-bold transition-all shadow-soft-sm flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install Sekarang</span>
        </button>
      </div>

      {showIOSModal && (
        <Modal
          isOpen={showIOSModal}
          onClose={() => setShowIOSModal(false)}
          title="Install BengkelPOS di iPhone / iPad"
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                BP
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">BengkelPOS PRO</h4>
                <p className="text-xs text-slate-500">Pasang di Layar Utama tanpa App Store</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <p className="font-semibold text-slate-800">Langkah pemasangan di Safari iOS:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                <li>Buka aplikasi di browser Safari.</li>
                <li>Tap tombol <strong>Share</strong> (ikon kotak panah ke atas) di bilah navigasi Safari.</li>
                <li>Pilih opsi <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama).</li>
                <li>Tap <strong>"Add"</strong> di pojok kanan atas.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};
