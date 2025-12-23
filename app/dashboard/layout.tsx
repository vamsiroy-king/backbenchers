import { MobileNav } from "@/components/ui/mobile-nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 relative">
            {/* Safe area padding for notch/dynamic island */}
            <div className="h-full w-full overflow-y-auto overflow-x-hidden pb-20 pt-[env(safe-area-inset-top)]">
                {children}
            </div>
            <MobileNav />
        </div>
    );
}
