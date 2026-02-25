import { MainNav } from "@/components/dashboard/main-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { Icons } from "@/components/icons"
import { NotificationBell } from "@/components/dashboard/notification-bell"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950/20 transition-colors duration-500">
            {/* Header: Desktop & Mobile simplified */}
            <header className="glass-header sticky top-0 z-40 transition-all">
                <div className="flex h-16 items-center px-4 md:px-8 max-w-[1600px] mx-auto w-full">
                    <div className="flex items-center font-black text-xl text-indigo-950 dark:text-indigo-500 group cursor-pointer transition-all active:scale-95">
                        <Icons.logo className="h-6 w-6 mr-2 group-hover:rotate-12 transition-transform" />
                        <span className="tracking-tighter">MapRank</span>
                    </div>

                    {/* Desktop Navigation */}
                    <MainNav className="hidden lg:flex mx-8" />

                    <div className="ml-auto flex items-center space-x-2 md:space-x-4">
                        <div className="hidden sm:block">
                            <NotificationBell />
                        </div>
                        <ModeToggle />
                        <UserNav />
                    </div>
                </div>
            </header>

            <main className="flex-1 pb-20 lg:pb-8 p-4 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-700">
                {children}
            </main>

            {/* Mobile Navigation */}
            <BottomNav />
        </div>
    )
}
