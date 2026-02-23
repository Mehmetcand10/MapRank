import { MainNav } from "@/components/dashboard/main-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { Icons } from "@/components/icons"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-[#0f111a] transition-colors duration-500">
            <div className="border-b bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-xl sticky top-0 z-40 transition-all">
                <div className="flex h-16 items-center px-4 md:px-8">
                    <MobileNav />
                    <div className="flex items-center font-black text-xl text-indigo-900 dark:text-indigo-400 mr-4 md:mr-8 group cursor-pointer transition-all active:scale-95">
                        <Icons.logo className="h-6 w-6 mr-2 group-hover:rotate-12 transition-transform" />
                        <span className="hidden sm:inline-block tracking-tighter">MapRank</span>
                    </div>
                    <MainNav className="hidden lg:flex mx-6" />
                    <div className="ml-auto flex items-center space-x-2 md:space-x-4">
                        <ModeToggle />
                        <UserNav />
                    </div>
                </div>
            </div>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                {children}
            </div>
        </div>
    )
}
