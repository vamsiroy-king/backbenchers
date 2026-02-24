"use client";

import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";

export function CapacitorAppWrapper({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initCapacitor = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    // Make the status bar dark mode aware and overlay the webview
                    await StatusBar.setStyle({ style: Style.Dark });
                    await StatusBar.setOverlaysWebView({ overlay: true });

                    // Hide the splash screen once JS has loaded
                    await SplashScreen.hide();
                } catch (e) {
                    console.warn("Capacitor Native APIs failed to initialize", e);
                }
            }
        };

        // Run client-side native initializations
        initCapacitor();
    }, []);

    return <>{children}</>;
}
