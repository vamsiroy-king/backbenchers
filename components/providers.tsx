"use client";

import { ToastContainer } from "@/components/ui/toast";
import { LoadingOverlay } from "@/components/ui/loading";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ToastContainer />
            <LoadingOverlay />
        </>
    );
}
