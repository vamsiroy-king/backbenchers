"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Lock } from "lucide-react";

interface ScratchCardProps {
    children: React.ReactNode;
    className?: string;
    onReveal?: () => void;
}

export function ScratchCard({ children, className, onReveal }: ScratchCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isScratching, setIsScratching] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size to match container
        const resize = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            // Fill with coating
            ctx.fillStyle = "#e5e7eb"; // gray-200
            if (document.documentElement.classList.contains("dark")) {
                ctx.fillStyle = "#27272a"; // zinc-800
            }

            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add Text/Icon overlay
            ctx.font = "bold 14px sans-serif";
            ctx.fillStyle = "#9ca3af"; // gray-400
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("SCRATCH TO REVEAL", canvas.width / 2, canvas.height / 2 + 20);

            // We can't easily draw icons on canvas without loading image, so we leave it simple
        };

        resize();
        window.addEventListener("resize", resize);

        return () => window.removeEventListener("resize", resize);
    }, []);

    const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
        if (isRevealed) return;
        setIsScratching(true);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Scratch effect
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.fill();

        // Check completion
        checkReveal();
    };

    const checkReveal = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Sample pixels to check if enough is cleared
        // Optimization: Check every 10th pixel
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let cleared = 0;
        const total = data.length / 4;

        for (let i = 0; i < data.length; i += 4 * 10) {
            if (data[i + 3] === 0) cleared++;
        }

        if (cleared / (total / 10) > 0.4) { // 40% threshold
            setIsRevealed(true);
            onReveal?.();
        }
    };

    return (
        <div ref={containerRef} className={cn("relative overflow-hidden select-none touch-none", className)}>
            {/* Hidden Content */}
            <div className={cn("transition-opacity duration-700", isRevealed ? "opacity-100" : "opacity-0 invisible")}>
                {children}
            </div>

            {/* Canvas Overlay */}
            <canvas
                ref={canvasRef}
                className={cn(
                    "absolute inset-0 cursor-pointer touch-none transition-opacity duration-500",
                    isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
                onMouseDown={handleScratch}
                onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
                onTouchMove={handleScratch}
                onTouchStart={handleScratch}
            />

            {/* Hint Overlay (fades out on first scratch) */}
            {!isScratching && !isRevealed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2">
                        <Sparkles className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                </div>
            )}
        </div>
    );
}
