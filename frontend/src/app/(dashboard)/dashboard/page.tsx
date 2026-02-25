"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Icons } from "@/components/icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
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

    useEffect(() => {
        fetchBusinesses()
    }, [])

    const handleDeleteBusiness = async (id: string, name: string) => {
        if (!confirm(`${name} isimli işletmeyi silmek istediğinize emin misiniz?`)) return

        try {
            await api.delete(`/businesses/${id}`)
            toast({
                title: "İşletme Silindi",
                description: "İşletme başarıyla kaldırıldı.",
            })
            fetchBusinesses()
        } catch (err) {
            toast({
                title: "Hata",
                description: "İşletme silinirken bir sorun oluştu.",
                variant: "destructive"
            })
        }
    }

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
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Command Center Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-950 dark:text-white uppercase">Komuta Merkezi</h1>
                    <p className="text-sm md:text-base text-slate-500 font-bold uppercase tracking-widest opacity-70">MapRank Intelligence Portal</p>
                </div>
                <Button
                    onClick={() => router.push("/business/analyze")}
                    className="w-full md:w-auto h-14 md:h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl md:rounded-full px-8 shadow-2xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Icons.plus className="mr-2 h-5 w-5" />
                    Yeni Analiz Başlat
                </Button>
            </div>

            {/* Quick Action Tiles - Premium Mobile First */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickTile
                    title="Grid Rank"
                    desc="Isı Haritası"
                    icon={Icons.map}
                    href="/business/grid-rank"
                    color="bg-indigo-600"
                    textColor="text-white"
                />
                <QuickTile
                    title="SEO Takibi"
                    desc="Sıralama Zekası"
                    icon={Icons.trending}
                    href="/business/seo"
                    color="bg-white dark:bg-slate-900"
                    textColor="text-indigo-600 dark:text-indigo-400"
                    border
                />
                <QuickTile
                    title="Yorumlar"
                    desc="AI Yanıt Merkezi"
                    icon={Icons.messageSquare}
                    href="/business/reviews"
                    color="bg-white dark:bg-slate-900"
                    textColor="text-emerald-600 dark:text-emerald-400"
                    border
                />
                <QuickTile
                    title="Enterprise"
                    desc="Toplu Yönetim"
                    icon={Icons.store}
                    href="/franchise"
                    color="bg-slate-950"
                    textColor="text-white"
                />
            </div>

            {/* Main Stats Area */}
            <div className="grid gap-6 md:grid-cols-12">
                <MotionCard className="md:col-span-8 bg-white dark:bg-slate-950 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Performans Özeti</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest mt-1">Son 30 Günlük Veri Seti</CardDescription>
                            </div>
                            <Badge variant="outline" className="rounded-full px-4 py-1 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-black">CANLI</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-6">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[{ n: 'Paz', s: 40 }, { n: 'Pzt', s: 45 }, { n: 'Sal', s: 42 }, { n: 'Çar', s: 55 }, { n: 'Per', s: 58 }, { n: 'Cum', s: 62 }, { n: 'Cmt', s: 65 }]}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="s" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </MotionCard>

                <div className="md:col-span-4 space-y-6">
                    <MotionCard className="bg-gradient-to-br from-indigo-600 to-indigo-900 border-none shadow-2xl rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <Icons.logo className="absolute -bottom-10 -right-10 h-40 w-40 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-4 text-center">Average Portfolio Score</p>
                        <div className="flex flex-col items-center justify-center space-y-2">
                            <span className="text-7xl font-black tracking-tighter">{avgScore}</span>
                            <Progress value={avgScore} className="h-2 w-full bg-white/20" />
                            <p className="text-[10px] font-bold text-indigo-200 mt-2 uppercase">İşletme Sağlık Endeksi: Mükemmel</p>
                        </div>
                    </MotionCard>

                    <div className="grid grid-cols-2 gap-4">
                        <StatsBox title="İşletme" val={businesses.length} icon={Icons.store} color="text-blue-500" />
                        <StatsBox title="Büyüme" val="+12%" icon={Icons.trending} color="text-emerald-500" />
                    </div>
                </div>
            </div>

            {/* Business List Section */}
            <div className="space-y-6 pb-12">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">Takip Edilen Yerler</h2>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {businesses.map((biz) => (
                        <PremiumBusinessCard key={biz.id} biz={biz} onDelete={handleDeleteBusiness} />
                    ))}
                    <button
                        onClick={() => router.push("/business/analyze")}
                        className="group flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-4 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-600 transition-all min-h-[220px]"
                    >
                        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center mb-4">
                            <Icons.plus className="h-8 w-8" />
                        </div>
                        <span className="font-black uppercase text-xs tracking-widest text-slate-400 group-hover:text-indigo-600">Yeni İşletme Ekle</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function QuickTile({ title, desc, icon: Icon, href, color, textColor, border }: any) {
    const router = useRouter()
    return (
        <button
            onClick={() => router.push(href)}
            className={cn(
                "p-5 rounded-[2rem] flex flex-col items-start gap-4 transition-all hover:-translate-y-1 active:scale-95 text-left group",
                color,
                textColor,
                border && "border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none"
            )}
        >
            <div className={cn(
                "p-3 rounded-2xl",
                color.includes("white") || color.includes("slate-900") ? "bg-slate-50 dark:bg-slate-800" : "bg-white/20"
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="font-black text-sm uppercase tracking-tight leading-none mb-1">{title}</p>
                <p className={cn("text-[9px] font-bold uppercase tracking-wider opacity-60", !textColor.includes("white") && "text-slate-400")}>{desc}</p>
            </div>
        </button>
    )
}

function StatsBox({ title, val, icon: Icon, color }: any) {
    return (
        <div className="p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/50 dark:shadow-none flex flex-col items-center text-center">
            <Icon className={cn("h-5 w-5 mb-2", color)} />
            <span className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">{val}</span>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{title}</p>
        </div>
    )
}

function PremiumBusinessCard({ biz, onDelete }: { biz: Business, onDelete: (id: string, name: string) => void }) {
    const router = useRouter()
    return (
        <MotionCard className="group glass-card rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all overflow-hidden p-0">
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase leading-tight tracking-tighter truncate max-w-[150px]">{biz.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center text-[10px] font-bold text-amber-500">
                                <Icons.star className="h-3 w-3 mr-1 fill-amber-500" />
                                {biz.total_rating}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">• {biz.review_count} Yorum</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black">%{biz.latest_ranking?.score || 0}</div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">MAPRANK SKORU</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                        size="sm"
                        onClick={() => router.push(`/business/grid-rank?id=${biz.id}`)}
                        className="rounded-2xl h-10 bg-slate-950 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest"
                    >
                        Grid Rank
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/business/seo?id=${biz.id}`)}
                        className="rounded-2xl h-10 text-[10px] font-black uppercase tracking-widest"
                    >
                        SEO
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/business/analyze?place_id=${biz.google_place_id}&name=${encodeURIComponent(biz.name)}`)}
                        className="rounded-2xl h-10 text-[10px] font-black uppercase border-slate-200 dark:border-slate-800"
                    >
                        Analiz
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/business/reviews?id=${biz.id}`)}
                        className="rounded-2xl h-10 text-[10px] font-black uppercase border-slate-200 dark:border-slate-800"
                    >
                        Yorumlar
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/business/consultant?id=${biz.id}`)}
                    className="h-8 text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-0"
                >
                    <Icons.bot className="h-3 w-3" />
                    AI Strateji Odası
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(biz.id, biz.name)}
                    className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 rounded-full"
                >
                    <Icons.minus className="h-4 w-4" />
                </Button>
            </div>
        </MotionCard>
    )
}
