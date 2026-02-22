"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Icons } from "@/components/icons"
import { MotionCard } from "@/components/ui/motion-card"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Business {
    id: string
    name: string
    google_place_id: string
    total_rating: number
    review_count: number
    latest_ranking?: {
        score: number
        snapshot_date: string
    }
    is_my_business: boolean
}

export default function DashboardPage() {
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await api.get("/businesses")
                setBusinesses(res.data)
            } catch (err) {
                console.error("Failed to fetch businesses", err)
            } finally {
                setLoading(false)
            }
        }
        fetchBusinesses()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Icons.spinner className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const myBusinesses = businesses.filter(b => b.is_my_business)
    const competitors = businesses.filter(b => !b.is_my_business)

    const avgScore = myBusinesses.length > 0
        ? Math.round(myBusinesses.reduce((acc, b) => acc + (b.latest_ranking?.score || 0), 0) / myBusinesses.length)
        : businesses.length > 0
            ? Math.round(businesses.reduce((acc, b) => acc + (b.latest_ranking?.score || 0), 0) / businesses.length)
            : 0

    return (
        <div className="space-y-6 p-4 md:p-8 animate-in fade-in duration-500">
            {/* Enterprise Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Genel Bakış</h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium text-balance">İşletmelerinizin dijital performans merkezi.</p>
                </div>
                <div className="w-full md:w-auto">
                    <Button onClick={() => router.push("/business/analyze")} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-2xl md:rounded-full px-6 py-6 md:py-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
                        <Icons.plus className="mr-2 h-4 w-4" />
                        Yeni İşletme Analiz Et
                    </Button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <MotionCard className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Icons.activity className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-white/80 text-xs font-bold uppercase tracking-widest">Global MapRank Skoru</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black">{avgScore}</span>
                            <span className="text-lg font-bold text-white/60">/ 100</span>
                        </div>
                        <Progress value={avgScore} className="h-2 bg-white/20" />
                        <p className="text-xs text-indigo-100 font-medium italic">Tüm portföyünüzün ağırlıklı başarı ortalaması.</p>
                    </CardContent>
                </MotionCard>

                <SmallStatCard
                    title="Takipteki İşletmeler"
                    value={businesses.length}
                    icon={Icons.store}
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                />
                <SmallStatCard
                    title="Haftalık Değişim"
                    value="+4.2"
                    unit="%"
                    icon={Icons.trending}
                    color="text-amber-500"
                    bg="bg-amber-50"
                />
            </div>

            {/* My Businesses Section */}
            <MotionCard delay={0.2} className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Icons.star className="h-5 w-5 text-amber-500 fill-amber-500" />
                            İşletmelerim
                        </CardTitle>
                        <CardDescription>Size ait ve yönettiğiniz işletmelerin performansı.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {myBusinesses.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 uppercase text-[10px] font-bold tracking-widest">
                            Henüz kendi işletmenizi eklemediniz.
                        </div>
                    ) : (
                        <BusinessTable businesses={myBusinesses} router={router} isMine={true} />
                    )}
                </CardContent>
            </MotionCard>

            {/* Competitors Section */}
            <MotionCard delay={0.3} className="border-none shadow-lg opacity-90">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Icons.activity className="h-5 w-5 text-indigo-500" />
                            Takip Edilen Rakipler
                        </CardTitle>
                        <CardDescription>Pazar analizi için gözlemlediğiniz rakip işletmeler.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {competitors.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 uppercase text-[10px] font-bold tracking-widest">
                            Henüz rakip işletme eklemediniz.
                        </div>
                    ) : (
                        <BusinessTable businesses={competitors} router={router} isMine={false} />
                    )}
                </CardContent>
            </MotionCard>
        </div>
    )
}

function BusinessTable({ businesses, router, isMine }: { businesses: Business[], router: any, isMine: boolean }) {
    return (
        <div className="space-y-4">
            {/* Desktop View (Table) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-50 dark:border-slate-800">
                        <tr className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                            <th className="pb-4 pl-2">İşletme Adı</th>
                            <th className="pb-4">MapRank Skoru</th>
                            <th className="pb-4">Puan / Yorum</th>
                            <th className="pb-4">Durum</th>
                            <th className="pb-4 text-right pr-2">Aksiyon</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {businesses.map((biz) => (
                            <tr key={biz.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-5 pl-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Icons.store className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors leading-tight">{biz.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{isMine ? "Asıl İşletme" : "İzlenen Rakip"}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-slate-800 dark:text-slate-100">%{biz.latest_ranking?.score || 0}</span>
                                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    (biz.latest_ranking?.score || 0) > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                                        (biz.latest_ranking?.score || 0) > 50 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                                                            'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                                )}
                                                style={{ width: `${biz.latest_ranking?.score || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5">
                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                        <span className="text-sm font-bold">{biz.total_rating}</span>
                                        <Icons.star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        <span className="text-[11px] text-slate-400 font-medium">({biz.review_count})</span>
                                    </div>
                                </td>
                                <td className="py-5">
                                    <Badge className={cn(
                                        "border-none rounded-lg font-bold text-[10px] uppercase tracking-tighter",
                                        isMine ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                    )}>
                                        {isMine ? "Yönetiliyor" : "Gözlemde"}
                                    </Badge>
                                </td>
                                <td className="py-5 text-right pr-2">
                                    <div className="flex items-center justify-end gap-2">
                                        {isMine && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        router.push(`/business/consultant?id=${biz.id}`)
                                                    }}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-[10px] font-black h-9 px-3 shadow-md shadow-indigo-200 uppercase tracking-tighter"
                                                >
                                                    <Icons.bot className="mr-1.5 h-3.5 w-3.5" />
                                                    Strateji Odası
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        router.push(`/business/benchmarking?id=${biz.id}`)
                                                    }}
                                                    className="hover:text-amber-600 hover:bg-amber-50 border-amber-100 dark:border-amber-900 rounded-xl text-xs h-9 px-3"
                                                >
                                                    <Icons.trending className="mr-1.5 h-3.5 w-3.5" />
                                                    Kıyasla
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/business/analyze?place_id=${biz.google_place_id}&name=${encodeURIComponent(biz.name)}`)}
                                            className="hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/40 rounded-xl dark:text-slate-400 text-xs h-9 px-3"
                                        >
                                            Analiz
                                            <Icons.arrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4">
                {businesses.map((biz) => (
                    <div
                        key={biz.id}
                        onClick={() => router.push(`/business/analyze?place_id=${biz.google_place_id}&name=${encodeURIComponent(biz.name)}`)}
                        className="p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 active:bg-slate-50 dark:active:bg-slate-800 transition-colors shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                    <Icons.store className="h-5 w-5 text-slate-400" />
                                </div>
                                <div className="max-w-[140px]">
                                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">{biz.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{isMine ? "Benim İşletmem" : "Rakip Takip"}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-blue-600 dark:text-blue-400">%{biz.latest_ranking?.score || 0}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Skor</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800 gap-2">
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-bold dark:text-slate-200">{biz.total_rating}</span>
                                <Icons.star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="text-[11px] text-slate-400 font-medium">({biz.review_count})</span>
                            </div>
                            <div className="flex gap-2">
                                {isMine && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/business/consultant?id=${biz.id}`)
                                            }}
                                            className="h-8 text-[10px] bg-indigo-600 text-white font-black px-3 rounded-xl shadow-lg shadow-indigo-200"
                                        >
                                            Strateji
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/business/benchmarking?id=${biz.id}`)
                                            }}
                                            className="h-8 text-[11px] border-amber-100 text-amber-600 px-3 rounded-xl"
                                        >
                                            Kıyasla
                                        </Button>
                                    </>
                                )}
                                <Button size="sm" className="h-8 text-[11px] bg-blue-600 px-3 rounded-xl">
                                    Analiz
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function SmallStatCard({ title, value, unit, icon: Icon, color, bg }: any) {
    return (
        <MotionCard className="border-none shadow-md">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <div className={cn("p-2 rounded-lg", bg)}>
                        <Icon className={cn("h-4 w-4", color)} />
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</span>
                    <span className="text-sm font-bold text-slate-400">{unit}</span>
                </div>
            </CardContent>
        </MotionCard>
    )
}
