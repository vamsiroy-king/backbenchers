import { MobileNav } from "@/components/ui/mobile-nav";
import { SuspendedCheck } from "@/components/SuspendedCheck";
import { AddToHomescreen } from "@/components/AddToHomescreen";
import { DesktopLayout } from "@/components/DesktopLayout";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SuspendedCheck>
            {/* Desktop Layout Wrapper - Handles responsive behavior */}
            <DesktopLayout>
                <div className="min-h-screen bg-black flex justify-center md:block md:bg-transparent">
                    {/* Mobile Container: constrained width on mobile, full width inside desktop layout */}
                    <div className="w-full md:w-full relative bg-black md:bg-transparent min-h-screen shadow-2xl shadow-black/50 md:shadow-none">
                        {/* Safe area padding */}
                        <div className="h-full w-full overflow-y-auto overflow-x-hidden pb-20 pt-[env(safe-area-inset-top)] md:pb-0">
                            {children}
                        </div>

                        {/* Mobile Nav - Hidden on Desktop handled by css inside component or here */}
                        <div className="md:hidden">
                            <MobileNav />
                        </div>

                        <AddToHomescreen />
                    </div>
                </div>
            </DesktopLayout>
        </SuspendedCheck>
    );
}
