"use client";

import { motion } from 'framer-motion';

// Base skeleton with shimmer effect
function SkeletonBase({ className }: { className?: string }) {
    return (
        <div className={`relative overflow-hidden bg-gray-200 rounded-xl ${className}`}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
        </div>
    );
}

// Card skeleton
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
            <div className="flex items-center gap-3">
                <SkeletonBase className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <SkeletonBase className="h-4 w-3/4" />
                    <SkeletonBase className="h-3 w-1/2" />
                </div>
            </div>
            <SkeletonBase className="h-20 w-full" />
        </div>
    );
}

// List item skeleton
export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <SkeletonBase className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <SkeletonBase className="h-4 w-1/2" />
                <SkeletonBase className="h-3 w-1/3" />
            </div>
            <SkeletonBase className="h-6 w-16 rounded-full" />
        </div>
    );
}

// Profile card skeleton
export function ProfileCardSkeleton() {
    return (
        <div className="bg-gray-900 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between">
                <SkeletonBase className="h-10 w-10" />
                <SkeletonBase className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-4">
                <SkeletonBase className="h-20 w-20 rounded-2xl" />
                <div className="flex-1 space-y-2">
                    <SkeletonBase className="h-6 w-32 bg-gray-700" />
                    <SkeletonBase className="h-4 w-24 bg-gray-700" />
                    <SkeletonBase className="h-8 w-28 rounded-lg bg-gray-700" />
                </div>
            </div>
        </div>
    );
}

// Stats grid skeleton
export function StatsGridSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                    <SkeletonBase className="h-10 w-10 rounded-xl" />
                    <SkeletonBase className="h-8 w-16" />
                    <SkeletonBase className="h-3 w-24" />
                </div>
            ))}
        </div>
    );
}

// List skeleton
export function ListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <ListItemSkeleton key={i} />
            ))}
        </div>
    );
}

export { SkeletonBase as Skeleton };
