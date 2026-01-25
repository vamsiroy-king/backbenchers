"use client";

import React, { useRef } from "react";
import {
    motion,
    useScroll,
    useSpring,
    useTransform,
    useMotionValue,
    useVelocity,
    useAnimationFrame
} from "framer-motion";

// Helper for wrapping
const wrap = (min: number, max: number, v: number) => {
    const rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

interface ParallaxProps {
    children: React.ReactNode;
    baseVelocity: number;
}

function ParallaxText({ children, baseVelocity = 100 }: ParallaxProps) {
    const baseX = useMotionValue(0);
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 400
    });
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
        clamp: false
    });

    /**
     * This is a magic wrapping for the length of the text - you
     * have to replace for wrapping that works for you or dynamically
     * calculate
     */
    const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

    const directionFactor = useRef<number>(1);
    useAnimationFrame((t, delta) => {
        let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

        /**
         * This is what changes the direction of the scroll once we
         * switch scrolling directions.
         */
        if (velocityFactor.get() < 0) {
            directionFactor.current = -1;
        } else if (velocityFactor.get() > 0) {
            directionFactor.current = 1;
        }

        moveBy += directionFactor.current * moveBy * velocityFactor.get();

        baseX.set(baseX.get() + moveBy);
    });

    return (
        <div className="overflow-hidden m-0 whitespace-nowrap flex flex-nowrap">
            <motion.div className="flex whitespace-nowrap gap-4 flex-nowrap" style={{ x }}>
                {children}
                {children}
                {children}
                {children}
            </motion.div>
        </div>
    );
}

interface ScrollVelocityMarqueeProps {
    children: React.ReactNode;
    direction?: 'left' | 'right';
    className?: string;
    speed?: number;
}

export const ScrollVelocityMarquee: React.FC<ScrollVelocityMarqueeProps> = ({
    children,
    direction = 'left',
    className = "",
    speed = 1
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Map scroll Y to X position. 
    // As page scrolls 0 -> 1000px, Marquee moves 0 -> 500px (or -500px)
    // direction 'left' = negative transform
    // direction 'right' = positive transform
    const dirMultiplier = direction === 'left' ? -1 : 1;

    // Use a spring to smooth out the sudden stops
    const smoothY = useSpring(scrollY, { stiffness: 100, damping: 20, mass: 0.5 });

    const x = useTransform(
        smoothY,
        [0, 5000], // Map a long scroll range
        [0, 5000 * dirMultiplier * 0.3 * speed] // To a horizontal movement (0.3 speed factor)
    );

    return (
        <div
            ref={containerRef}
            className={`w-full overflow-hidden ${className}`}
            style={{ touchAction: 'none' }} // prevent touch drag interference?
        >
            <motion.div
                className="flex gap-4 w-max px-4"
                style={{ x }}
            >
                {/* Render children enough times to cover width if needed, but for now just single scroll-linked strip */}
                {children}
                {/* Duplicate once for safety/continuity feeling? If visual gap is issue. */}
                {children}
            </motion.div>
        </div>
    );
};
