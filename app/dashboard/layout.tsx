import { MobileNav } from "@/components/ui/mobile-nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* MOBILE: Native fullscreen layout */}
            <div className="md:hidden min-h-screen bg-white dark:bg-gray-950 relative">
                {/* Safe area padding for notch/dynamic island */}
                <div className="h-full w-full overflow-y-auto overflow-x-hidden pb-20 pt-[env(safe-area-inset-top)]">
                    {children}
                </div>
                <MobileNav />
            </div>

            {/* DESKTOP: Phone simulator preview */}
            <div className="hidden md:flex min-h-screen bg-[#1a1a1a] items-center justify-center py-4">
                <div className="w-full max-w-[430px] h-[932px] bg-black rounded-[55px] shadow-[0_0_0_3px_#3a3a3a,0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute inset-[12px] bg-white dark:bg-gray-950 rounded-[45px] overflow-hidden">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 h-7 w-28 bg-black rounded-full z-[9999]" />
                        <div className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {children}
                        </div>
                        <MobileNav />
                    </div>
                </div>
            </div>
        </>
    );
}
