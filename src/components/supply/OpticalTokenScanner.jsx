import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  QrCode,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

export default function OpticalTokenScanner({
  onScanToken,
  isActive = true,
  soundEnabled = true,
  hapticEnabled = true,
}) {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [torchActive, setTorchActive] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [lastScannedRaw, setLastScannedRaw] = useState(null);
  const [laserBuffer, setLaserBuffer] = useState('');
  const lastKeyTimeRef = useRef(0);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Play feedback sounds
  const playScanBeep = useCallback(() => {
    if (soundEnabled) soundEngine.playPop();
    if (hapticEnabled) hapticEngine.mediumTick();
  }, [soundEnabled, hapticEnabled]);

  // Extract integer token from scanned text (e.g., "TOKEN_42" or "42" or URL with token)
  const extractToken = useCallback((rawData) => {
    if (!rawData) return null;
    const cleanStr = String(rawData).trim();

    // Direct number: "42"
    if (/^\d{1,4}$/.test(cleanStr)) {
      return Number(cleanStr);
    }

    // Pattern like "TOKEN:42" or "TOKEN_42" or "ID-42"
    const match = cleanStr.match(/(?:token|id|student)[\s:_#-]*(\d{1,4})/i);
    if (match && match[1]) {
      return Number(match[1]);
    }

    // Any digit group
    const fallbackDigits = cleanStr.match(/\b\d{1,4}\b/);
    if (fallbackDigits) {
      return Number(fallbackDigits[0]);
    }

    return null;
  }, []);

  // Handle successful scan
  const handleDetectedToken = useCallback(
    (tokenNo, rawText) => {
      if (!tokenNo) return;
      playScanBeep();
      setLastScannedRaw({ tokenNo, rawText, time: new Date().toLocaleTimeString() });
      onScanToken(tokenNo);
    },
    [onScanToken, playScanBeep]
  );

  // 1. HARDWARE LASER SCANNER WAND LISTENER
  // Hardware barcode/RFID scanners type keys at superhuman speed (<25ms per char) followed by Enter
  useEffect(() => {
    if (!isActive) return;

    let buffer = '';

    const handleKeyDown = (e) => {
      // Ignore if user is inside a form input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 1) {
          const parsed = extractToken(buffer);
          if (parsed) {
            handleDetectedToken(parsed, `Laser Wand: ${buffer}`);
          }
          buffer = '';
        }
      } else if (e.key.length === 1) {
        // If speed between keys is > 60ms, reset buffer (it was human typing, not a wand burst)
        if (diff > 60 && buffer.length > 0) {
          buffer = '';
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, extractToken, handleDetectedToken]);

  // 2. WEBRTC CAMERA STREAM INITIALIZATION
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() || {};
      setTorchSupported(Boolean(capabilities.torch));
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Camera permission denied or unavailable');
      setCameraActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setCameraActive(false);
    setTorchActive(false);
  }, []);

  // Toggle flashlight / torch
  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const nextState = !torchActive;
      await track.applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchActive(nextState);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  // Flip camera (front / back)
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // 3. BARCODE DETECTOR SCANNING LOOP
  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    // Check if BarcodeDetector API exists natively
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a'],
      });

      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            const token = extractToken(rawVal);
            if (token) {
              handleDetectedToken(token, rawVal);
            }
          }
        } catch (_) {}
      }, 250);
    }

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [cameraActive, extractToken, handleDetectedToken]);

  // Lifecycle start / stop with component visibility
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive, facingMode, startCamera, stopCamera]);

  return (
    <div className="w-full flex flex-col items-center p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/30 shadow-xl space-y-4">
      {/* HEADER STATUS */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
            Optical & Laser QR / Barcode Scanner
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1 ${
                torchActive
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
              title="Toggle Flashlight / Torch"
            >
              {torchActive ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={flipCamera}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Flip Front/Rear Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CAMERA VIEWFINDER FRAME */}
      <div className="relative w-full max-w-md h-[280px] sm:h-[340px] rounded-3xl overflow-hidden bg-black flex items-center justify-center border-2 border-emerald-500/40 shadow-inner">
        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 text-gray-400">
            <CameraOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-xs">
              {cameraError || 'Camera stream is stopped or permissions are pending.'}
            </p>
            <button
              onClick={startCamera}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Start Camera
            </button>
          </div>
        )}

        {/* SCANNING TARGET OVERLAY */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Viewfinder Reticle Corners */}
            <div className="w-56 h-56 relative border-2 border-emerald-500/30 rounded-2xl">
              <span className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 absolute -top-1 -left-1 rounded-tl-lg" />
              <span className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 absolute -top-1 -right-1 rounded-tr-lg" />
              <span className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 absolute -bottom-1 -left-1 rounded-bl-lg" />
              <span className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 absolute -bottom-1 -right-1 rounded-br-lg" />

              {/* Animated Laser Scanline */}
              <motion.div
                animate={{ y: [0, 220, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.9)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* HARDWARE LASER WAND STATUS BANNER */}
      <div className="w-full max-w-md p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 flex items-center space-x-3 text-xs text-cyan-900 dark:text-cyan-200">
        <Barcode className="w-5 h-5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
        <div className="flex-1 min-w-0">
          <strong>Hardware Laser Wand Active:</strong> Point handheld USB/Bluetooth scanner gun at student ID card anywhere on this screen.
        </div>
      </div>

      {/* RECENT SCAN BADGE */}
      {lastScannedRaw && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-3 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              Scanned <strong>Token #{lastScannedRaw.tokenNo}</strong> ({lastScannedRaw.time})
            </span>
          </div>
          <span className="font-mono text-[10px] text-gray-500 truncate max-w-[120px]">
            {lastScannedRaw.rawText}
          </span>
        </motion.div>
      )}
    </div>
  );
}
