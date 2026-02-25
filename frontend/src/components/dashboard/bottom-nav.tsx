"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

const navItems = [
    { href: "/dashboard", icon: Icons.activity, label: "Ana Sayfa" },
    { href: "/business/analyze", icon: Icons.search, label: "Analiz" },
    { href: "/business/grid-rank", icon: Icons.map, label: "Grid" },
    { href: "/business/seo", icon: Icons.trending, label: "SEO" },
    { href: "/business/reviews", icon: Icons.messageSquare, label: "Yorum" },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav px-2 pb-safe-area-inset-bottom">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-90",
                                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                            {isActive && (
                                <div className="absolute top-0 h-1 w-8 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
