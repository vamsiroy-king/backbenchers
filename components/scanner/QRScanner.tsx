"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw, Loader2, Scan, XCircle } from "lucide-react";

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (error: string) => void;
    isActive: boolean;
}

export default function QRScanner({ onScan, onError, isActive }: QRScannerProps) {
    const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Refs for stable state access in async closures
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(true);
    const scannedRef = useRef(false);
    const containerIdRef = useRef(`qr-reader-${Date.now()}`);

    useEffect(() => {
        mountedRef.current = true;

        // Cleanup function for component unmount
        return () => {
            mountedRef.current = false;
            cleanupScanner();
        };
    }, []);

    const cleanupScanner = async () => {
        if (!scannerRef.current) return;

        try {
            const state = scannerRef.current.getState();
            // 2 = SCANNING, 3 = PAUSED
            if (state === 2 || state === 3) {
                await scannerRef.current.stop();
            }
            scannerRef.current.clear();
        } catch (error) {
            console.warn("Scanner cleanup warning:", error);
        } finally {
            scannerRef.current = null;
        }
    };

    useEffect(() => {
        if (!isActive) {
            cleanupScanner();
            return;
        }

        const initializeScanner = async () => {
            try {
                // Ensure fresh start
                await cleanupScanner();

                if (!mountedRef.current) return;

                setStatus("loading");
                setErrorMessage("");
                scannedRef.current = false;

                // Wait a tick for DOM to ready
                await new Promise(r => setTimeout(r, 100));

                const element = document.getElementById(containerIdRef.current);
                if (!element) return; // Component might have unmounted

                // Create new instance
                const scanner = new Html5Qrcode(containerIdRef.current, {
                    verbose: false,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                });

                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        if (scannedRef.current) return;
                        scannedRef.current = true;
                        console.log("Scan success:", decodedText);
                        onScan(decodedText);
                    },
                    () => {
                        // Ignore frame errors 
                    }
                );

                if (mountedRef.current) {
                    setStatus("scanning");
                } else {
                    cleanupScanner();
                }

            } catch (err: any) {
                console.error("Scanner start error:", err);
                // Don't show error if it's just an interruption
                if (err?.name === "AbortError" || err?.message?.includes("aborted")) return;

                if (mountedRef.current) {
                    setStatus("error");
                    const msg = err?.message || "Camera access failed";
                    setErrorMessage(msg);
                    onError?.(msg);
                }
            }
        };

        initializeScanner();

    }, [isActive, onScan, onError]);

    const handleRetry = () => {
        window.location.reload();
    };

    if (!isActive) return null;

    return (
        <div className="w-full relative">
            <style jsx global>{`
                #${containerIdRef.current} video {
                    border-radius: 16px !important;
                    object-fit: cover !important;
                }
                #${containerIdRef.current}__dashboard,
                #${containerIdRef.current}__status_span,
                #${containerIdRef.current}__camera_selection {
                    display: none !important;
                }
            `}</style>

            <div
                id={containerIdRef.current}
                className="w-full aspect-square bg-black rounded-2xl overflow-hidden"
            />

            {status === "loading" && (
                <div className="absolute inset-0 bg-gray-900 rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
                    <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mb-4" />
                    <p className="text-white font-semibold">Opening Camera...</p>
                </div>
            )}

            {status === "error" && (
                <div className="absolute inset-0 bg-gray-900 rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                        <Camera className="h-6 w-6 text-red-400" />
                    </div>
                    <p className="text-red-400 font-semibold mb-1">Camera Error</p>
                    <p className="text-gray-400 text-xs mb-4 max-w-[200px] mx-auto">{errorMessage}</p>
                    <button
                        onClick={handleRetry}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            )}

            {status === "scanning" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    {/* Scanner Frame */}
                    <div className="w-64 h-64 relative opacity-80">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                        {/* Scanning Line Animation */}
                        <div className="absolute left-0 right-0 h-0.5 bg-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                    </div>

                    {/* Badge */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-white/90 text-xs font-semibold tracking-wide">Scanning</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
