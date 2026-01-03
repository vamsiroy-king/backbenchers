"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useMemo, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MasonryGridProps {
    items: any[];
    renderItem: (item: any, index: number) => ReactNode;
    columns?: {
        default: number;
        sm?: number;
        md?: number;
        lg?: number;
    };
    className?: string;
    gap?: number;
}

export function MasonryGrid({
    items,
    renderItem,
    columns = { default: 2, md: 3, lg: 4 },
    className,
    gap = 16
}: MasonryGridProps) {
    const [columnCount, setColumnCount] = useState(columns.default);

    // Handle responsive column counting
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width >= 1024 && columns.lg) setColumnCount(columns.lg);
            else if (width >= 768 && columns.md) setColumnCount(columns.md);
            else if (width >= 640 && columns.sm) setColumnCount(columns.sm);
            else setColumnCount(columns.default);
        };

        handleResize(); // Initial set
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [columns]);

    // Distribute items into columns
    const columnItems = useMemo(() => {
        const cols: any[][] = Array.from({ length: columnCount }, () => []);
        items.forEach((item, i) => {
            cols[i % columnCount].push({ item, originalIndex: i });
        });
        return cols;
    }, [items, columnCount]);

    return (
        <div
            className={cn("flex w-full", className)}
            style={{ gap: `${gap}px` }}
        >
            {columnItems.map((col, colIndex) => (
                <div
                    key={`col-${colIndex}`}
                    className="flex flex-col flex-1"
                    style={{ gap: `${gap}px` }}
                >
                    {col.map(({ item, originalIndex }) => (
                        <motion.div
                            key={originalIndex}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: (originalIndex % 10) * 0.05,
                                type: "spring",
                                stiffness: 350,
                                damping: 25
                            }}
                        >
                            {renderItem(item, originalIndex)}
                        </motion.div>
                    ))}
                </div>
            ))}
        </div>
    );
}
