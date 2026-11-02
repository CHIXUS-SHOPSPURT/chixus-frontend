import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsInstalled(Boolean(isStandalone));

    // Detect iOS devices
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
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
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch {
      return false;
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

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'drawer' | 'gate' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General instructions for desktop/Android browsers
      alert('To install CHIXUS Sovereign Node: Tap your browser menu (⋮ or Share) and select "Install app" or "Add to Home screen".');
    }
  };

  const buttonStyle: React.CSSProperties =
    variant === 'drawer'
      ? {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.08) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 15px rgba(56, 189, 248, 0.12)'
        }
      : variant === 'gate'
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          color: '#38bdf8',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.6px',
          transition: 'all 0.15s ease'
        }
      : {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          color: '#38bdf8',
          fontSize: '10.5px',
          fontFamily: 'monospace',
          fontWeight: 800,
          cursor: 'pointer',
          letterSpacing: '0.5px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        };

  return (
    <>
      <button
        type="button"
        id="chixus-pwa-install-btn"
        onClick={handleInstallClick}
        style={buttonStyle}
        title="Install CHIXUS sovereign node to your device home screen"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {installSuccess ? (
            <Check style={{ width: '13px', height: '13px', color: '#10b981' }} />
          ) : (
            <Download style={{ width: '13px', height: '13px', color: '#38bdf8' }} />
          )}
          <span>{installSuccess ? 'INSTALLED' : 'INSTALL APP'}</span>
        </div>
        {variant === 'drawer' && (
          <span style={{ fontSize: '9px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px' }}>
            PWA STANDALONE
          </span>
        )}
      </button>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: '#0c121e',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone style={{ width: '18px', height: '18px', color: '#38bdf8' }} />
                <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff' }}>
                  INSTALL ON IPHONE / IPAD
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', lineHeight: 1.6, margin: '0 0 14px 0' }}>
              iOS Safari requires manual home screen pinning:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#38bdf8', color: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                  1
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#e2e8f0', lineHeight: 1.4 }}>
                  Tap the <strong>Share</strong> icon in the Safari bottom toolbar (box with arrow pointing up).
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#38bdf8', color: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                  2
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#e2e8f0', lineHeight: 1.4 }}>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
};
