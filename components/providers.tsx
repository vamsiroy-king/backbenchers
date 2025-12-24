"use client";

import { ToastContainer } from "@/components/ui/toast";
import { LoadingOverlay } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            {children}
            <ToastContainer />
            <LoadingOverlay />
        </ErrorBoundary>
    );
}
