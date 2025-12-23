import { MerchantNav } from "@/components/merchant/MerchantNav";

export default function MerchantDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-black flex justify-center">
            {/* Mobile-sized container centered on all screens */}
            <div className="w-full max-w-[430px] min-h-screen bg-white dark:bg-gray-950 relative shadow-xl">
                <div className="h-full w-full overflow-y-auto overflow-x-hidden pb-24 pt-[env(safe-area-inset-top)]">
                    {children}
                </div>
                <MerchantNav />
            </div>
        </div>
    );
}
