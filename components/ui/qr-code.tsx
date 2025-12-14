"use client";

import { QRCodeSVG } from 'qrcode.react';

interface BBQRCodeProps {
    value: string; // BB-ID or BBM-ID
    size?: number;
    withLogo?: boolean;
}

export function BBQRCode({ value, size = 128, withLogo = true }: BBQRCodeProps) {
    return (
        <div className="relative inline-block">
            <QRCodeSVG
                value={value}
                size={size}
                level="H" // High error correction for logo overlay
                bgColor="#ffffff"
                fgColor="#000000"
                style={{ borderRadius: 8 }}
            />

            {/* BB Logo Overlay in Center */}
            {withLogo && (
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="h-10 w-10 bg-white rounded-lg shadow-lg flex items-center justify-center border-2 border-primary">
                        <span className="font-black text-primary text-lg">B</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// QR Code with frame and branding
export function BrandedQRCode({ value, label }: { value: string; label?: string }) {
    return (
        <div className="flex flex-col items-center">
            {/* Dashed border frame */}
            <div className="relative p-4">
                <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-gray-200" />
                <BBQRCode value={value} size={120} />
            </div>

            {/* Label */}
            {label && (
                <div className="mt-3 bg-gray-100 rounded-lg px-4 py-2">
                    <p className="text-sm font-mono font-bold text-gray-600 tracking-wider">{label}</p>
                </div>
            )}

            {/* Brand footer */}
            <div className="mt-3 flex items-center gap-1">
                <div className="h-4 w-4 rounded bg-primary/10 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary">B</span>
                </div>
                <p className="text-[8px] text-gray-400 tracking-widest">BACKBENCHERS VERIFIED</p>
            </div>
        </div>
    );
}
