import { MobileNav } from "@/components/ui/mobile-nav";
import { SuspendedCheck } from "@/components/SuspendedCheck";
import { AddToHomescreen } from "@/components/AddToHomescreen";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SuspendedCheck>
            {/* bg-black is theme-aware via globals.css .light-theme overrides */}
            <div className="min-h-screen bg-black flex justify-center">
                {/* Responsive container: Full width on mobile, centered max-width on desktop */}
                <div className="w-full md:max-w-7xl relative bg-black min-h-screen shadow-2xl shadow-black/50">
                    {/* Safe area padding for notch/dynamic island */}
                    <div className="h-full w-full overflow-y-auto overflow-x-hidden pb-20 pt-[env(safe-area-inset-top)]">
                        {children}
                    </div>
                    <MobileNav />
                    <AddToHomescreen />
                </div>
            </div>
        </SuspendedCheck>
    );
}
