"use client";

import { ToastContainer } from "@/components/ui/toast";
import { LoadingOverlay } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalRatingProvider } from "@/components/providers/GlobalRatingProvider";
import { FavoritesProvider } from "@/components/providers/FavoritesProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <FavoritesProvider>
                <GlobalRatingProvider>
                    {children}
                </GlobalRatingProvider>
            </FavoritesProvider>
            <ToastContainer />
            <LoadingOverlay />
        </ErrorBoundary>
    );
}

