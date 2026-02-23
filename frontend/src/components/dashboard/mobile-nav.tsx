"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Menu } from "lucide-react"

export function MobileNav() {
    const pathname = usePathname()
    const [open, setOpen] = React.useState(false)

    const routes = [
        {
            href: "/dashboard",
            label: "Genel Bakış",
            icon: Icons.activity,
        },
        {
            href: "/business/analyze",
            label: "Analiz",
            icon: Icons.search,
        },
        {
            href: "/business/search",
            label: "Keşfet / Ara",
            icon: Icons.globe,
        },
        {
            href: "/business/seo",
            label: "SEO Takibi",
            icon: Icons.search,
        },
        {
            href: "/business/reviews",
            label: "Yorum Yanıt Merkezi",
            icon: Icons.messageSquare,
        },
        {
            href: "/franchise",
            label: "Enterprise",
            icon: Icons.store,
        },
        {
            href: "/billing",
            label: "Faturalandırma",
            icon: Icons.creditCard,
        },
        {
            href: "/settings",
            label: "Ayarlar",
            icon: Icons.settings,
        },
    ]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="mr-2 px-2 text-base hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden rounded-xl h-10 w-10 flex items-center justify-center border border-slate-200 dark:border-slate-800"
                >
                    <Menu className="h-6 w-6 text-slate-900 dark:text-white" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="fixed inset-y-0 left-0 z-50 h-full w-[300px] border-r bg-background p-0 sm:max-w-none animate-in slide-in-from-left duration-300">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="flex items-center gap-2 font-black text-xl text-indigo-900 dark:text-indigo-400">
                        <Icons.logo className="h-6 w-6" />
                        MapRank
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-2 p-6">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all active:scale-95",
                                pathname === route.href
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <route.icon className="h-5 w-5" />
                            {route.label}
                        </Link>
                    ))}
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Premium Plan</p>
                        <p className="text-[10px] text-indigo-400 dark:text-indigo-500 font-medium">Sınırsız analiz ve stratejik oda erişimi aktif.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
