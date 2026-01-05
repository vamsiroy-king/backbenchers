"use client";

import { ToastContainer } from "@/components/ui/toast";
import { LoadingOverlay } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalRatingProvider } from "@/components/providers/GlobalRatingProvider";
import { FavoritesProvider } from "@/components/providers/FavoritesProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <FavoritesProvider>
                    <GlobalRatingProvider>
                        {children}
                    </GlobalRatingProvider>
                </FavoritesProvider>
            </ThemeProvider>
            <ToastContainer />
            <LoadingOverlay />
        </ErrorBoundary>
    );
}
