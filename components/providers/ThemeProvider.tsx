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

    // Load theme from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme) {
            setThemeState(savedTheme);
        }
    }, []);

    // Apply theme to document
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;

        if (theme === "light") {
            // White + Green Theme
            root.style.setProperty("--bg-primary", "#ffffff");
            root.style.setProperty("--bg-secondary", "#f8f9fa");
            root.style.setProperty("--bg-card", "#ffffff");
            root.style.setProperty("--text-primary", "#111111");
            root.style.setProperty("--text-secondary", "#666666");
            root.style.setProperty("--accent", "#22c55e");
            root.style.setProperty("--accent-light", "#dcfce7");
            root.style.setProperty("--border", "#e5e7eb");
            root.classList.add("light-theme");
            root.classList.remove("dark-theme");
        } else {
            // Dark Theme (current)
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
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
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
