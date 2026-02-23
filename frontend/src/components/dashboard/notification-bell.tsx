"use client"

import { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

interface Alert {
    id: string
    type: string
    title: string
    message: string
    is_read: boolean
    created_at: string
}

export function NotificationBell() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const unreadCount = alerts.filter(a => !a.is_read).length

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await api.get("/alerts")
                setAlerts(res.data)
            } catch (err) {
                console.error("Alerts load failed", err)
            }
        }
        fetchAlerts()

        const interval = setInterval(fetchAlerts, 60000)
        return () => clearInterval(interval)
    }, [])

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/alerts/${id}/read`)
            setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a))
        } catch (err) {
            console.error("Mark read failed", err)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95">
                    <Icons.alertCircle className={cn("h-5 w-5", unreadCount > 0 ? "text-indigo-600 animate-pulse" : "text-slate-500")} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-bounce" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-950" align="end" forceMount>
                <DropdownMenuLabel className="bg-slate-900 p-4 font-normal">
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Bildirim Merkezi</h3>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 m-0" />
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
                            <Icons.checkCircle className="h-8 w-8 text-slate-100 dark:text-slate-800" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Her şey yolunda!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-900">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        "p-4 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50",
                                        !alert.is_read && "bg-indigo-50/20 dark:bg-indigo-900/5 border-l-2 border-indigo-600"
                                    )}
                                    onClick={() => markAsRead(alert.id)}
                                >
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full mt-1.5 shrink-0 shadow-sm",
                                            alert.type === "critical" ? "bg-red-500 shadow-red-500/50" :
                                                alert.type === "success" ? "bg-emerald-500 shadow-emerald-500/50" : "bg-indigo-500 shadow-indigo-500/50"
                                        )} />
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none tracking-tight">{alert.title}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{alert.message}</p>
                                            <p className="text-[9px] text-slate-400 font-bold italic">{new Date(alert.created_at).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 text-center border-t border-slate-100 dark:border-slate-800">
                    <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-indigo-600 hover:bg-transparent hover:text-indigo-700">
                        Tümünü Görüntüle
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
