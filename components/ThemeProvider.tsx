"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount - default to dark if not set
    useEffect(() => {
        const savedTheme = localStorage.getItem("bb-theme") as Theme;
        if (savedTheme) {
            setThemeState(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        } else {
            // Default to dark mode for Whop-style UI
            document.documentElement.classList.add("dark");
        }
        setMounted(true);
    }, []);

    // Update document class and localStorage when theme changes
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("bb-theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    // Return fallback if not in ThemeProvider - default to dark theme
    if (context === undefined) {
        return {
            theme: 'dark' as const,
            toggleTheme: () => { },
            setTheme: () => { }
        };
    }
    return context;
}

// Theme toggle component for use in settings
export function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${theme === "dark" ? "bg-primary" : "bg-gray-200"
                } ${className}`}
            aria-label="Toggle dark mode"
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${theme === "dark" ? "translate-x-6" : "translate-x-1"
                    }`}
            />
            <span className="sr-only">Toggle dark mode</span>
        </button>
    );
}
