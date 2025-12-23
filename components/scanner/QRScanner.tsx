"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Loader2, Zap, Focus, AlertCircle } from "lucide-react";

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (error: string) => void;
    isActive: boolean;
}

// High-performance scanner configuration
const SCANNER_CONFIG = {
    fps: 30,                           // Maximum FPS for instant detection
    qrbox: { width: 280, height: 280 }, // Larger scan area
    aspectRatio: 1.0,
    disableFlip: false,                // Allow both orientations
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], // Only QR codes for speed
};

// Optimal camera constraints for high-quality scanning
const CAMERA_CONSTRAINTS = {
    facingMode: "environment",
    width: { ideal: 1920, min: 1280 },  // High resolution
    height: { ideal: 1080, min: 720 },
    focusMode: "continuous",            // Auto-focus continuously
    advanced: [
        { zoom: 1.0 },
        { focusMode: "continuous" as any },
        { exposureMode: "continuous" as any },
    ] as any,
};

export default function QRScanner({ onScan, onError, isActive }: QRScannerProps) {
    const [status, setStatus] = useState<"loading" | "scanning" | "error" | "success">("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [scanCount, setScanCount] = useState(0);

    // Refs for stable state access
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(true);
    const scannedRef = useRef(false);
    const containerIdRef = useRef(`qr-scanner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    const initAttemptRef = useRef(0);

    // Cleanup scanner safely
    const cleanupScanner = useCallback(async () => {
        if (!scannerRef.current) return;

        try {
            const state = scannerRef.current.getState();
            if (state === 2 || state === 3) {
                await scannerRef.current.stop();
            }
            scannerRef.current.clear();
        } catch (e) {
            // Ignore cleanup errors
        } finally {
            scannerRef.current = null;
        }
    }, []);

    // Handle successful scan with debounce
    const handleSuccessfulScan = useCallback((decodedText: string) => {
        if (scannedRef.current) return;
        scannedRef.current = true;

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        // Visual feedback
        setStatus("success");
        setScanCount(prev => prev + 1);

        // Immediate callback
        console.log("[QRScanner] ✅ Scan successful:", decodedText);
        onScan(decodedText);
    }, [onScan]);

    // Initialize scanner with optimal settings
    const initializeScanner = useCallback(async () => {
        if (!mountedRef.current || !isActive) return;

        try {
            await cleanupScanner();

            if (!mountedRef.current) return;

            setStatus("loading");
            setErrorMessage("");
            scannedRef.current = false;

            // Small delay for DOM readiness
            await new Promise(r => setTimeout(r, 100));

            const element = document.getElementById(containerIdRef.current);
            if (!element) {
                console.warn("[QRScanner] Container not found");
                return;
            }

            // Create scanner with basic config (more compatible)
            const scanner = new Html5Qrcode(containerIdRef.current, {
                verbose: false,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            });

            scannerRef.current = scanner;

            // Scanner config - simpler version for compatibility
            const scanConfig = {
                fps: 15,  // Reduced for better compatibility
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            // Try multiple camera options in order of preference
            const cameraAttempts: Array<{ facingMode: string | { exact: string } }> = [
                { facingMode: "environment" },  // Back camera
                { facingMode: { exact: "environment" } },  // Strict back camera
                { facingMode: "user" },  // Front camera as fallback
            ];

            let started = false;
            let lastError = null;

            for (const cameraId of cameraAttempts) {
                if (started || !mountedRef.current) break;

                try {
                    console.log("[QRScanner] Trying camera:", cameraId);
                    await scanner.start(
                        cameraId,
                        scanConfig,
                        handleSuccessfulScan,
                        () => { } // Ignore frame errors
                    );
                    started = true;
                    console.log("[QRScanner] ✅ Camera started successfully");
                } catch (err: any) {
                    console.log("[QRScanner] Camera attempt failed:", err?.message);
                    lastError = err;
                    // Try next camera option
                }
            }

            if (!started) {
                throw lastError || new Error("No camera could be started");
            }

            if (mountedRef.current) {
                setStatus("scanning");
            } else {
                await cleanupScanner();
            }

        } catch (err: any) {
            console.error("[QRScanner] Start error:", err);

            if (err?.name === "AbortError") return;

            if (mountedRef.current) {
                setStatus("error");
                let msg = "Camera access failed";

                if (err?.message?.includes("Permission") || err?.message?.includes("denied")) {
                    msg = "Camera permission denied. Please allow camera access in your browser settings.";
                } else if (err?.message?.includes("NotFound") || err?.message?.includes("Requested device not found")) {
                    msg = "No camera found. Please ensure your device has a camera.";
                } else if (err?.message?.includes("NotReadable") || err?.message?.includes("in use")) {
                    msg = "Camera is busy. Please close other apps using the camera.";
                } else if (err?.message?.includes("NotAllowed")) {
                    msg = "Camera access blocked. Check your browser permissions.";
                } else if (err?.message) {
                    msg = err.message;
                }

                setErrorMessage(msg);
                onError?.(msg);
            }
        }
    }, [isActive, handleSuccessfulScan, cleanupScanner, onError]);

    // Mount/unmount handling
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            cleanupScanner();
        };
    }, [cleanupScanner]);

    // Active state handling
    useEffect(() => {
        if (isActive) {
            initAttemptRef.current += 1;
            initializeScanner();
        } else {
            cleanupScanner();
        }
    }, [isActive, initializeScanner, cleanupScanner]);

    // Retry handler
    const handleRetry = useCallback(() => {
        scannedRef.current = false;
        setStatus("loading");
        setErrorMessage("");
        initializeScanner();
    }, [initializeScanner]);

    if (!isActive) return null;

    return (
        <div className="w-full relative">
            {/* Optimized global styles for the scanner */}
            <style jsx global>{`
                #${containerIdRef.current} {
                    position: relative !important;
                }
                #${containerIdRef.current} video {
                    border-radius: 20px !important;
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                #${containerIdRef.current}__dashboard,
                #${containerIdRef.current}__status_span,
                #${containerIdRef.current}__camera_selection,
                #${containerIdRef.current}__header_message,
                #${containerIdRef.current} > div:first-child {
                    display: none !important;
                }
                #${containerIdRef.current} canvas {
                    display: none !important;
                }
            `}</style>

            {/* Scanner container */}
            <div
                id={containerIdRef.current}
                className="w-full aspect-square bg-gray-950 rounded-[20px] overflow-hidden shadow-2xl"
            />

            {/* Loading state */}
            {status === "loading" && (
                <div className="absolute inset-0 bg-gray-950 rounded-[20px] flex flex-col items-center justify-center z-20">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full animate-pulse" />
                        <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-emerald-400 animate-spin" />
                    </div>
                    <p className="text-white font-semibold mt-4">Initializing Camera...</p>
                    <p className="text-gray-400 text-xs mt-1">High-resolution mode</p>
                </div>
            )}

            {/* Error state */}
            {status === "error" && (
                <div className="absolute inset-0 bg-gray-950 rounded-[20px] flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <p className="text-red-400 font-bold text-lg mb-1">Camera Error</p>
                    <p className="text-gray-400 text-sm mb-6 max-w-[250px]">{errorMessage}</p>
                    <button
                        onClick={handleRetry}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Success flash */}
            {status === "success" && (
                <div className="absolute inset-0 bg-emerald-500/20 rounded-[20px] flex items-center justify-center z-20 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Zap className="h-10 w-10 text-white" />
                    </div>
                </div>
            )}

            {/* Active scanning overlay */}
            {status === "scanning" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    {/* Premium scanner frame */}
                    <div className="w-72 h-72 relative">
                        {/* Corner brackets - thicker and more prominent */}
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-emerald-400 rounded-tl-xl shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        <div className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-emerald-400 rounded-tr-xl shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-emerald-400 rounded-bl-xl shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-emerald-400 rounded-br-xl shadow-[0_0_15px_rgba(52,211,153,0.5)]" />

                        {/* Animated scanning line */}
                        <div
                            className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"
                            style={{
                                animation: "scanLine 1.5s ease-in-out infinite",
                                boxShadow: "0 0 20px rgba(52,211,153,0.8), 0 0 40px rgba(52,211,153,0.4)"
                            }}
                        />

                        {/* Focus icon in center */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Focus className="w-8 h-8 text-emerald-400/40" />
                        </div>
                    </div>

                    {/* Status badge */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                        <div className="bg-black/70 backdrop-blur-xl px-5 py-2.5 rounded-full flex items-center gap-3 border border-emerald-500/30 shadow-lg">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                            <span className="text-white text-sm font-semibold tracking-wide">Point at QR Code</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanning animation keyframes */}
            <style jsx>{`
                @keyframes scanLine {
                    0%, 100% {
                        top: 10%;
                        opacity: 0.5;
                    }
                    50% {
                        top: 85%;
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
