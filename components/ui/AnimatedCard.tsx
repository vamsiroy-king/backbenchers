"use client";

import { useSpring, animated } from '@react-spring/web';
import { ReactNode, useState } from 'react';

interface AnimatedCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

/**
 * Ultra-smooth animated card using react-spring physics
 * 60fps+ hardware-accelerated animations
 */
export function AnimatedCard({ children, className = "", onClick }: AnimatedCardProps) {
    const [isPressed, setIsPressed] = useState(false);

    const springProps = useSpring({
        transform: isPressed ? 'scale(0.985)' : 'scale(1)',
        config: {
            tension: 300,
            friction: 10,
            mass: 0.5,
        },
    });

    return (
        <animated.div
            style={springProps}
            className={className}
            onClick={onClick}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
        >
            {children}
        </animated.div>
    );
}

/**
 * Smooth button with spring physics
 */
interface AnimatedButtonProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
}

export function AnimatedButton({ children, className = "", onClick, variant = 'primary' }: AnimatedButtonProps) {
    const [isPressed, setIsPressed] = useState(false);

    const springProps = useSpring({
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        config: {
            tension: 400,
            friction: 15,
        },
    });

    return (
        <animated.button
            style={springProps}
            className={className}
            onClick={onClick}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
        >
            {children}
        </animated.button>
    );
}
