"use client";

import { QRCodeSVG } from 'qrcode.react';

interface BBQRCodeProps {
    value: string; // BB-ID or BBM-ID
    size?: number;
    withLogo?: boolean;
}

// High-quality QR code generator optimized for scanning
export function BBQRCode({ value, size = 160, withLogo = true }: BBQRCodeProps) {
    // Calculate logo size proportionally (should be ~15% of QR for best scanning)
    const logoSize = Math.max(24, Math.round(size * 0.15));

    return (
        <div className="relative inline-block bg-white p-2 rounded-xl shadow-sm">
            <QRCodeSVG
                value={value}
                size={size}
                level="H" // High error correction (30% recovery) - essential for logo overlay
                bgColor="#ffffff"
                fgColor="#000000"
                includeMargin={true} // White margin improves scanning
                style={{
                    display: 'block',
                    borderRadius: 4,
                }}
                imageSettings={withLogo ? {
                    src: "", // We'll use custom overlay instead
                    x: undefined,
                    y: undefined,
                    height: 0,
                    width: 0,
                    excavate: false,
                } : undefined}
            />

            {/* BB Logo Overlay in Center - using B mark image */}
            {withLogo && (
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        className="bg-white rounded-lg shadow-md flex items-center justify-center overflow-hidden"
                        style={{
                            width: logoSize + 4,
                            height: logoSize + 4,
                        }}
                    >
                        <img
                            src="/b-logo.png"
                            alt="B"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// QR Code with frame and branding - larger and more prominent
export function BrandedQRCode({ value, label }: { value: string; label?: string }) {
    return (
        <div className="flex flex-col items-center">
            {/* Clean container */}
            <div className="relative p-3 bg-white rounded-2xl shadow-lg">
                {/* Subtle corner accents */}
                <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl-lg" />
                <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />
                <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />
                <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br-lg" />

                <BBQRCode value={value} size={140} withLogo={true} />
            </div>

            {/* Label - BB-ID */}
            {label && (
                <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-xl px-5 py-2.5">
                    <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300 tracking-widest">{label}</p>
                </div>
            )}

            {/* Brand footer */}
            <div className="mt-3 flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">B</span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-widest uppercase">BackBenchers Verified</p>
            </div>
        </div>
    );
}

// Larger QR code for the ID card display
export function IDCardQRCode({ value }: { value: string }) {
    return (
        <div className="bg-white p-3 rounded-2xl shadow-xl">
            <QRCodeSVG
                value={value}
                size={180}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
                includeMargin={true}
                style={{ display: 'block' }}
            />
            <div className="text-center mt-2">
                <p className="font-mono font-bold text-xs text-gray-600 tracking-wider">{value}</p>
            </div>
        </div>
    );
}

