"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import api from "@/lib/api"
import { Icons } from "@/components/icons"

interface User {
    full_name: string
    email: string
}

export function UserNav() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get<User>("/users/me")
                setUser(response.data)
            } catch (error) {
                console.error("Failed to fetch user", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    const handleLogout = () => {
        localStorage.removeItem("token")
        router.push("/login")
    }

    const getInitials = (name: string) => {
        if (!name) return "SC"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
    }

    if (loading) {
        return (
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Icons.spinner className="h-4 w-4 animate-spin" />
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-indigo-100 hover:ring-indigo-200 transition-all">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="" alt={user?.full_name || "@user"} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                            {getInitials(user?.full_name || "")}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-950/90 backdrop-blur-xl border-zinc-800 text-zinc-100 shadow-2xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-white">{user?.full_name || "User"}</p>
                        <p className="text-xs leading-none text-zinc-400">
                            {user?.email || "user@example.com"}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="focus:bg-indigo-600 focus:text-white cursor-pointer transition-colors">
                        <Link href="/settings">
                            <Icons.user className="mr-2 h-4 w-4" />
                            <span>Profil</span>
                            <DropdownMenuShortcut className="text-zinc-400">⇧⌘P</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-indigo-600 focus:text-white cursor-pointer transition-colors">
                        <Link href="/billing">
                            <Icons.creditCard className="mr-2 h-4 w-4" />
                            <span>Faturalandırma</span>
                            <DropdownMenuShortcut className="text-zinc-400">⌘B</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-indigo-600 focus:text-white cursor-pointer transition-colors">
                        <Link href="/settings">
                            <Icons.settings className="mr-2 h-4 w-4" />
                            <span>Ayarlar</span>
                            <DropdownMenuShortcut className="text-zinc-400">⌘S</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-100 focus:bg-red-900/50 cursor-pointer transition-colors">
                    <Icons.logOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                    <DropdownMenuShortcut className="text-red-400">⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
