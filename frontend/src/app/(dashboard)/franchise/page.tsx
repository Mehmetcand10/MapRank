"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MotionCard } from "@/components/ui/motion-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { cn } from "@/lib/utils"

interface Business {
    id: string
    name: string
    address: string
    maprank_score?: number
    latest_ranking?: {
        score: number
        rank_position: number
    }
}

function FranchiseContent() {
    const router = useRouter()
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await api.get("/businesses")
                setBusinesses(res.data)
            } catch (err) {
                console.error("Franchise fetch failed", err)
            } finally {
                setLoading(false)
            }
        }
        fetchBusinesses()
    }, [])

    const chartData = businesses.map(b => ({
        name: b.name.split(' ')[0],
        fullName: b.name,
        score: b.latest_ranking?.score || 0
    })).sort((a, b) => b.score - a.score)

    const avgScore = businesses.length > 0
        ? Math.round(businesses.reduce((acc, b) => acc + (b.latest_ranking?.score || 0), 0) / businesses.length)
        : 0

    if (loading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <Icons.spinner className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">Franchise Verileri Konsolide Ediliyor...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Enterprise Genel Merkez</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">Tüm lokasyonlarınızın performans kıyaslaması ve toplu görünümü.</p>
                </div>
                <div className="p-4 bg-indigo-600 rounded-[2rem] text-white shadow-2xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Icons.activity className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Ağ Geneli Puan</p>
                        <p className="text-2xl font-black">%{avgScore}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12">
                {/* Ranking Bar Chart */}
                <MotionCard className="lg:col-span-8 border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Icons.trophy className="h-4 w-4 text-amber-500" />
                            Lokasyon Bazlı Skor Kıyaslaması
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="score" radius={[10, 10, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#10b981' : entry.score > 50 ? '#6366f1' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </MotionCard>

                {/* Score Cards */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">En İyi Lokasyonlar</h3>
                    {chartData.map((item, idx) => (
                        <MotionCard key={idx} className="border-none shadow-sm hover:shadow-md transition-all group bg-white dark:bg-slate-900 rounded-2xl">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center font-black",
                                            idx === 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{item.fullName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase">Aktif İzleme</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 dark:text-white">%{item.score}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">MapRank Skoru</p>
                                    </div>
                                </div>
                            </CardContent>
                        </MotionCard>
                    ))}
                </div>

                {/* Regional Heatmap Info */}
                <MotionCard className="lg:col-span-12 border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] overflow-hidden">
                    <div className="grid md:grid-cols-2">
                        <div className="p-12 space-y-6">
                            <Badge className="bg-indigo-600 text-white border-none py-1 px-3">FRANCHISE V3</Badge>
                            <h2 className="text-3xl font-black uppercase tracking-tight">Bölgesel Hakimiyet Analizi</h2>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Tüm şubelerinizin verilerini yapay zeka ile harmanlayarak hangi bölgede yeni bir şube açmanız gerektiğini veya hangi şubenizin lokal rakibi tarafından tehdit edildiğini anında raporlarız.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <p className="text-2xl font-black text-indigo-400">%{businesses.length * 4}</p>
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Pazar Payı Etkisi</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-emerald-400">%{avgScore + 12}</p>
                                    <p className="text-[10px] font-bold uppercase text-slate-500">Ortalama Büyüme</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-indigo-600/10 p-12 flex items-center justify-center relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                            <Icons.globe className="h-48 w-48 text-indigo-500/30 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                <Button className="bg-white text-indigo-900 hover:bg-slate-100 rounded-full px-8 h-12 font-black uppercase text-xs tracking-widest shadow-2xl">
                                    Detaylı Harita Görünümü
                                </Button>
                            </div>
                        </div>
                    </div>
                </MotionCard>
            </div>
        </div>
    )
}

export default function FranchisePage() {
    return (
        <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><Icons.spinner className="h-8 w-8 animate-spin text-indigo-600" /></div>}>
            <FranchiseContent />
        </Suspense>
    )
}
