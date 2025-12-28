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
            <div className="min-h-screen bg-[#0a0a0b] flex justify-center">
                {/* Mobile-sized container centered on all screens */}
                <div className="w-full max-w-[430px] min-h-screen bg-[#0a0a0b] relative">
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

