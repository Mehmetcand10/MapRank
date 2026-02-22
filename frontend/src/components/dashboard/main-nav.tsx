import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

import { cn } from "@/lib/utils"

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
                Analiz
            </Link>
            <Link
                href="/business/search"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Keşfet / Ara
            </Link>
            <Link
                href="/reviews"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Yorumlar
            </Link>
            <Link
                href="/billing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Faturalandırma
            </Link>
            <Link
                href="/settings"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Ayarlar
            </Link>
            <div className="ml-auto flex items-center space-x-4">
                <ModeToggle />
            </div>
        </nav>
    )
}
