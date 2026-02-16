import { MobileNav } from "@/components/ui/mobile-nav";
import { DesktopSidebar } from "@/components/ui/desktop-sidebar";
import { SuspendedCheck } from "@/components/SuspendedCheck";
import { AddToHomescreen } from "@/components/AddToHomescreen";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SuspendedCheck>
            <div className="min-h-screen bg-black flex justify-center md:justify-start">

                {/* Desktop Sidebar - Left Rail */}
                <DesktopSidebar />

                {/* Main Content Area */}
                <div className="flex-1 transition-all duration-300 w-full relative">
                    {/* Centered Feed Container for "Instagram View" */}
                    <div className="w-full h-full mx-auto md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl relative min-h-screen shadow-2xl shadow-black bg-black">
                        {/* Safe area padding + GPU-accelerated scrolling */}
                        <div className="h-full w-full overflow-y-auto overflow-x-hidden pb-20 pt-[env(safe-area-inset-top)] md:pb-0 scrollbar-hide contain-paint">
                            {/* Page transition — smooth fade on tab switch */}
                            <div className="page-transition">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation - Hidden on Desktop */}
                <div className="md:hidden">
                    <MobileNav />
                </div>

                <AddToHomescreen />
            </div>
        </SuspendedCheck>
    );
}
