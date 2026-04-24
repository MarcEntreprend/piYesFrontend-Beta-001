// components/QrScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Zap, ZapOff, RefreshCw, Camera, ArrowLeft, CheckCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScan, onClose, title = "Scan QR Code" }) => {
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(localStorage.getItem('lastCameraId'));
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-full-container";

  useEffect(() => {
    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        setCameras(devices);
        if (devices.length > 0) {
          let initialCamera = currentCameraId;

          if (!initialCamera || !devices.find(d => d.id === initialCamera)) {
            const backCamera = devices.find(d =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('arrière') ||
              d.label.toLowerCase().includes('rear')
            );
            initialCamera = backCamera ? backCamera.id : devices[0].id;
          }

          setCurrentCameraId(initialCamera);
          localStorage.setItem('lastCameraId', initialCamera);
          await startScanning(initialCamera);
        }
      } catch (err) {
        console.error("Error getting cameras", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner on unmount", err));
      }
    };
  }, []);

  const startScanning = async (cameraId: string) => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    const html5QrCode = new Html5Qrcode(containerId);
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        cameraId,
        {
          fps: 20,
          qrbox: { width: 320, height: 320 },   // zone de scan (masquée via CSS)
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // ignore scan failures
        }
      );

      // Check for flash support
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities() as any;
        if (capabilities?.torch) {
          setHasFlash(true);
        } else {
          setHasFlash(false);
        }
      } catch (e) {
        setHasFlash(false);
      }
    } catch (err) {
      console.error("Error starting scanner", err);
    }
  };

  const selectCamera = async (cameraId: string) => {
    setCurrentCameraId(cameraId);
    localStorage.setItem('lastCameraId', cameraId);
    setShowCameraMenu(false);
    await startScanning(cameraId);
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    await selectCamera(nextCameraId);
  };

  const toggleFlash = async () => {
    if (!scannerRef.current || !hasFlash) return;
    try {
      const newState = !isFlashOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState } as any]
      });
      setIsFlashOn(newState);
    } catch (err) {
      console.error("Error toggling flash", err);
    }
  };

  return (
    <div className="fixed inset-0 z-250 bg-black flex flex-col overflow-hidden">
      {/* Styles pour masquer le rectangle de scan de la librairie */}
      <style>{`
        #${containerId} .qr-shaded-region {
          border: none !important;
          background: transparent !important;
        }
        #${containerId} .qr-region {
          border: none !important;
        }
      `}</style>

      {/* Camera View - Full Screen */}
      <div id={containerId} className="absolute inset-0 w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>

      {/* Custom UI Overlay */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">

        {/* Header */}
        <div className="p-6 flex items-center justify-between pointer-events-auto bg-linear-to-b from-black/70 to-transparent">
          <button onClick={onClose} className="p-2 text-white active:scale-90 transition-transform">
            <ArrowLeft size={28} />
          </button>
          <h2 className="text-white font-bold text-lg tracking-tight">{title}</h2>
          <div className="w-10"></div>
        </div>

        {/* Center Scanning Area */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Darkened surroundings */}
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 bg-black/50"></div>
            <div className="flex flex-row">
              <div className="flex-1 bg-black/50"></div>
              <div className="w-[320px] h-[320px] relative pointer-events-auto">
                {/* Frame Corners */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-3xl"></div>

                {/* Scanning Line Animation */}
                <motion.div
                  initial={{ top: '5%' }}
                  animate={{ top: '95%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-6 right-6 h-1 bg-(--primary-color) shadow-[0_0_20px_var(--primary-color)] z-10 rounded-full"
                />

                {/* Inner Glow */}
                <div className="absolute inset-0 rounded-3xl bg-white/5 animate-pulse"></div>
              </div>
              <div className="flex-1 bg-black/50"></div>
            </div>
            <div className="flex-1 bg-black/50"></div>
          </div>

          {/* Instruction Text */}
          <div className="absolute top-[calc(50%+160px)] left-0 right-0 text-center px-10">
            <p className="text-white/80 text-xs font-medium leading-relaxed drop-shadow-md">
              Placez le QR Code piYès à l'intérieur du cadre pour scanner automatiquement
            </p>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-12 pb-24 flex items-center justify-center gap-10 pointer-events-auto bg-linear-to-t from-black/80 to-transparent relative">
          {hasFlash && (
            <button
              onClick={toggleFlash}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isFlashOn ? 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.6)]' : 'bg-white/10 text-white backdrop-blur-2xl border border-white/20'}`}
            >
              {isFlashOn ? <Zap size={28} fill="currentColor" /> : <ZapOff size={28} />}
            </button>
          )}

          {cameras.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowCameraMenu(!showCameraMenu)}
                className="w-16 h-16 rounded-full bg-white/10 text-white backdrop-blur-2xl border border-white/20 flex items-center justify-center active:scale-90 transition-all shadow-xl"
              >
                <Camera size={28} />
              </button>

              {/* Camera Selection Menu */}
              <AnimatePresence>
                {showCameraMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl z-300"
                  >
                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                      {cameras.map((camera) => (
                        <button
                          key={camera.id}
                          onClick={() => selectCamera(camera.id)}
                          className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-colors flex items-center justify-between ${currentCameraId === camera.id ? 'bg-(--primary-color) text-white' : 'text-white/80 hover:bg-white/5'}`}
                        >
                          <span className="truncate pr-2">{camera.label || `Camera ${camera.id.substring(0, 4)}`}</span>
                          {currentCameraId === camera.id && <CheckCircle size={16} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="w-16 h-16 rounded-full bg-white/10 text-white backdrop-blur-2xl border border-white/20 flex items-center justify-center active:scale-90 transition-all shadow-xl"
            >
              <RefreshCw size={28} />
            </button>
          )}
        </div>
      </div>

      {/* Initializing State */}
      {isInitializing && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4 z-260">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-white/60 text-sm font-bold tracking-widest uppercase">Initialisation caméra...</p>
        </div>
      )}
    </div>
  );
};

export default QrScanner;