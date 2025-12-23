import { MerchantNav } from "@/components/merchant/MerchantNav";

export default function MerchantDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 relative">
            <div className="h-full w-full overflow-y-auto overflow-x-hidden pb-24 pt-[env(safe-area-inset-top)]">
                {children}
            </div>
            <MerchantNav />
        </div>
    );
}
