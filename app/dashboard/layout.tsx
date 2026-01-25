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
            <div className="min-h-screen bg-black flex justify-center">
                {/* Responsive container: Full width on mobile, centered max-width on desktop */}
                <div className="w-full md:max-w-md lg:max-w-lg xl:max-w-xl relative bg-black min-h-screen border-x border-white/[0.05] shadow-2xl shadow-black">
                    {/* Safe area padding */}
                    <div className="h-full w-full overflow-y-auto overflow-x-hidden pb-20 pt-[env(safe-area-inset-top)] scrollbar-hide">
                        {children}
                    </div>
                    <MobileNav />
                    <AddToHomescreen />
                </div>
            </div>
        </SuspendedCheck>
    );
}
