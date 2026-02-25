import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

import { cn } from "@/lib/utils"

import { Icons } from "@/components/icons"

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            <Link
                href="/dashboard"
                className="text-sm font-medium transition-colors hover:text-primary"
            >
                Genel Bakış
            </Link>
            <Link
                href="/business/analyze"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Pazar Analizi
            </Link>
            <Link
                href="/business/grid-rank"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Grid Rank
            </Link>
            <Link
                href="/franchise"
                className="text-sm font-black uppercase tracking-tight text-slate-500 transition-colors hover:text-indigo-600 flex items-center gap-1.5"
            >
                <Icons.store className="h-4 w-4" />
                Enterprise
            </Link>
            <div className="flex-1" />
        </nav>
    )
}
