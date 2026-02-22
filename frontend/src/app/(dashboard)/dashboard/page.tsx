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

    const avgScore = businesses.length > 0
        ? Math.round(businesses.reduce((acc, b) => acc + (b.latest_ranking?.score || 0), 0) / businesses.length)
        : 0

    return (
        <div className="space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
            {/* Enterprise Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Genel Bakış</h1>
                    <p className="text-slate-500 font-medium">İşletmelerinizin dijital performans merkezi.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => router.push("/business/analyze")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg shadow-blue-200">
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

            {/* Businesses List (Enterprise Table Style) */}
            <MotionCard delay={0.2} className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Takip Edilen Bölgeler</CardTitle>
                        <CardDescription>İşletmelerinizin anlık durum tablosu.</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-blue-100 text-blue-600 bg-blue-50">
                        {businesses.length} Aktif Takip
                    </Badge>
                </CardHeader>
                <CardContent>
                    {businesses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
                                <Icons.store className="h-10 w-10 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold">Henüz İşletme Yok</h3>
                                <p className="text-sm text-slate-500">İlk işletmenizi analiz edip takip etmeye başlayın.</p>
                            </div>
                            <Button variant="outline" onClick={() => router.push("/business/analyze")} className="rounded-full">
                                Hemen Keşfet
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-50">
                                    <tr className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                        <th className="pb-4 pl-2">İşletme Adı</th>
                                        <th className="pb-4">MapRank Skoru</th>
                                        <th className="pb-4">Puan / Yorum</th>
                                        <th className="pb-4">Durum</th>
                                        <th className="pb-4 text-right pr-2">Aksiyon</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {businesses.map((biz) => (
                                        <tr key={biz.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 pl-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                        <Icons.store className="h-5 w-5 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{biz.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Bölgesel Lider</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black text-slate-800">%{biz.latest_ranking?.score || 0}</span>
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${(biz.latest_ranking?.score || 0) > 80 ? 'bg-emerald-500' :
                                                                    (biz.latest_ranking?.score || 0) > 50 ? 'bg-amber-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${biz.latest_ranking?.score || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-bold text-slate-700">{biz.total_rating}</span>
                                                    <Icons.star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                    <span className="text-[11px] text-slate-400 font-medium">({biz.review_count})</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <Badge className="bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 rounded-lg">
                                                    Optimize
                                                </Badge>
                                            </td>
                                            <td className="py-5 text-right pr-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/business/analyze?place_id=${biz.google_place_id}&name=${encodeURIComponent(biz.name)}`)}
                                                    className="hover:text-blue-600 hover:bg-blue-50/50 rounded-lg"
                                                >
                                                    Analizi Gör
                                                    <Icons.arrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </MotionCard>
        </div>
    )
}

function SmallStatCard({ title, value, unit, icon: Icon, color, bg }: any) {
    return (
        <MotionCard className="border-none shadow-md">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <div className={`p-2 rounded-lg ${bg}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{value}</span>
                    <span className="text-sm font-bold text-slate-400">{unit}</span>
                </div>
            </CardContent>
        </MotionCard>
    )
}
