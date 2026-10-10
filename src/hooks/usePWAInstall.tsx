import React, { useEffect, useState } from 'react';
import { Download, WifiOff, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const PWAInstallButton: React.FC<{
  lang: 'bn' | 'en';
  onOpenDownloadCenter?: () => void;
}> = ({ lang, onOpenDownloadCenter }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  const handleClick = async () => {
    if (onOpenDownloadCenter) {
      onOpenDownloadCenter();
      return;
    }
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
        title={
          lang === 'bn'
            ? 'অনলাইন থেকে অ্যাপ ও সকল ফাইল এখনই ডাউনলোড করুন'
            : 'Download App & Files Online Now'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span>
          {isInstalled
            ? lang === 'bn'
              ? 'ডাউনলোড সেন্টার'
              : 'Download Hub'
            : isIOS
              ? lang === 'bn'
                ? 'অ্যাপ ডাউনলোড'
                : 'Download App'
              : lang === 'bn'
                ? 'এখনই ডাউনলোড'
                : 'Download Now'}
        </span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {lang === 'bn'
                  ? 'এল ডরাডো মডেল স্কুল অ্যাপ ইনস্টল গাইড'
                  : 'Install El Dorado Model School App'}
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
              <p>
                {lang === 'bn'
                  ? 'এই অ্যাপটি প্রোগ্রেসিভ ওয়েব অ্যাপ (PWA) এবং অফলাইন ক্যাশিং প্রযুক্তিতে নির্মিত। ইন্টারনেট ছাড়াও রোল অনুযায়ী বেতন, রেজাল্ট ও উপস্থিতির তথ্য দেখতে নিচের ধাপ অনুসরণ করুন:'
                  : 'This app supports full offline caching (PWA). To install on your device home screen or desktop:'}
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs">
                <li>
                  {lang === 'bn'
                    ? 'ব্রাউজারের অ্যাড্রেস বারের ডানদিকে Install আইকন বা মেনু (⋮ / Share) বাটনে ট্যাপ করুন।'
                    : 'Click the browser address bar Install icon or open the browser menu (⋮ / Share).'}
                </li>
                <li>
                  {lang === 'bn'
                    ? '"Add to Home Screen" অথবা "Install App" সিলেক্ট করুন।'
                    : 'Select "Add to Home Screen" or "Install App".'}
                </li>
              </ol>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-lg bg-red-700 hover:bg-red-800 py-2 text-xs font-semibold text-white transition-colors"
            >
              {lang === 'bn' ? 'বুঝেছি' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {lang === 'bn'
          ? 'অফলাইন মোড সক্রিয় — লোকাল ক্যাশ ডাটাবেস ব্যবহৃত হচ্ছে'
          : 'Offline Mode Active — Using Cached Local Database'}
      </span>
    </div>
  );
};
