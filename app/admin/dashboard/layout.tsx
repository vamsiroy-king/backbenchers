"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { useState, createContext, useContext, useEffect } from "react";

// Context for sidebar state
const SidebarContext = createContext({ collapsed: false, setCollapsed: (v: boolean) => { } });
export const useSidebar = () => useContext(SidebarContext);

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);

    // Restore dark mode from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('admin_theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }, []);

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Topbar */}
                <AdminTopbar sidebarCollapsed={collapsed} />

                {/* Main Content */}
                <main
                    className="pt-16 min-h-screen transition-all duration-300"
                    style={{ marginLeft: collapsed ? 80 : 280 }}
                >
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarContext.Provider>
    );
}
