"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    toggleTheme: () => { },
    setTheme: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    // Load theme - FORCE DARK MODE
    useEffect(() => {
        setMounted(true);
        // Force dark mode, ignore local storage light preference
        setThemeState("dark");
        localStorage.setItem("theme", "dark");
    }, []);

    // Apply theme to document
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;

        // Always apply dark theme
        root.style.setProperty("--bg-primary", "#000000");
        root.style.setProperty("--bg-secondary", "#111111");
        root.style.setProperty("--bg-card", "#1a1a1a");
        root.style.setProperty("--text-primary", "#ffffff");
        root.style.setProperty("--text-secondary", "#888888");
        root.style.setProperty("--accent", "#22c55e");
        root.style.setProperty("--accent-light", "#166534");
        root.style.setProperty("--border", "#333333");
        root.classList.add("dark-theme");
        root.classList.remove("light-theme");
        root.classList.add("dark");
    }, [theme, mounted]);

    const toggleTheme = () => {
        // Disabled - locked to dark
        setThemeState("dark");
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    // Prevent flash by not rendering until mounted
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
