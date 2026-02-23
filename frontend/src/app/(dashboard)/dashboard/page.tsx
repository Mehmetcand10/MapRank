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

            {/* TABS SEGMENTATION */}
            <Tabs defaultValue="my-businesses" className="w-full">
                <TabsList className="mb-8 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full md:w-auto h-auto grid grid-cols-2 md:inline-flex">
                    <TabsTrigger value="my-businesses" className="rounded-xl px-8 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white shadow-none data-[state=active]:shadow-xl transition-all font-bold">
                        Benim İşletmelerim
                    </TabsTrigger>
                    <TabsTrigger value="competitors" className="rounded-xl px-8 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white shadow-none data-[state=active]:shadow-xl transition-all font-bold">
                        Rakip İşletmeler
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="my-businesses" className="mt-0 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                        <span className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sahibi Olduğunuz Yerler</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                    </div>
                    {myBusinesses.length > 0 ? (
                        <>
                            <div className="hidden md:block overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-xl">
                                <BusinessTable
                                    businesses={myBusinesses}
                                    onDelete={handleDeleteBusiness}
                                    isMyBusinessTab={true}
                                />
                            </div>
                            <div className="md:hidden space-y-4">
                                {myBusinesses.map((biz) => (
                                    <MobileBusinessCard
                                        key={biz.id}
                                        biz={biz}
                                        onDelete={handleDeleteBusiness}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            title="Henüz kendi işletmenizi eklemediniz."
                            desc="Analiz sayfasından kendi işletmenizi işaretleyerek başlayın."
                        />
                    )}
                </TabsContent>

                <TabsContent value="competitors" className="mt-0 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                        <span className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Takipteki Rakipler</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                    </div>
                    {competitors.length > 0 ? (
                        <>
                            <div className="hidden md:block overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-xl">
                                <BusinessTable
                                    businesses={competitors}
                                    onDelete={handleDeleteBusiness}
                                    isMyBusinessTab={false}
                                />
                            </div>
                            <div className="md:hidden space-y-4">
                                {competitors.map((biz) => (
                                    <MobileBusinessCard
                                        key={biz.id}
                                        biz={biz}
                                        onDelete={handleDeleteBusiness}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            title="Takip edilen rakip bulunamadı."
                            desc="Rakiplerinizi ekleyerek pazar payınızı karşılaştırın."
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

interface BusinessTableProps {
    businesses: Business[]
    onDelete: (id: string, name: string) => void
    isMyBusinessTab?: boolean
}

function BusinessTable({ businesses, onDelete, isMyBusinessTab }: BusinessTableProps) {
    const router = useRouter()
    return (
        <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <tr className="text-[10px] md:text-xs uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">
                    <th className="px-6 py-5">İşletme Adı</th>
                    <th className="px-6 py-5">MapRank Skoru</th>
                    <th className="px-6 py-5">Yorum / Puan</th>
                    <th className="px-6 py-5 text-right font-black">Aksiyonlar</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {businesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group">
                        <td className="px-6 py-5">
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{biz.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{biz.google_place_id}</span>
                            </div>
                        </td>
                        <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-sm shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20">
                                    %{biz.latest_ranking?.score || 0}
                                </div>
                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600" style={{ width: `${biz.latest_ranking?.score || 0}%` }} />
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-5">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{biz.total_rating}</span>
                                    <Icons.star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{biz.review_count} Yorum</span>
                            </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                                {isMyBusinessTab && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/business/consultant?id=${biz.id}`)}
                                        className="rounded-xl h-9 bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold shadow-lg shadow-indigo-100 dark:shadow-none uppercase text-[10px]"
                                    >
                                        <Icons.bot className="h-3 w-3 mr-1" />
                                        Strateji
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/business/benchmarking?id=${biz.id}`)}
                                    className="rounded-xl h-9 border-slate-200 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold uppercase text-[10px]"
                                >
                                    <Icons.trending className="h-3 w-3 mr-1" />
                                    Kıyasla
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/business/reviews?id=${biz.id}`)}
                                    className="rounded-xl h-9 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-bold uppercase text-[10px]"
                                >
                                    <Icons.messageSquare className="h-3 w-3 mr-1" />
                                    Yorumlar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/business/analyze?place_id=${biz.google_place_id}&name=${encodeURIComponent(biz.name)}`)}
                                    className="rounded-xl h-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-bold uppercase text-[10px]"
                                >
                                    Analiz
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/business/seo?id=${biz.id}`)}
                                    className="rounded-xl h-9 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-bold uppercase text-[10px]"
                                >
                                    SEO
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(biz.id, biz.name)}
                                    className="rounded-xl h-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                >
                                    <Icons.minus className="h-4 w-4" />
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

function MobileBusinessCard({ biz, onDelete }: { biz: Business, onDelete: (id: string, name: string) => void }) {
    const router = useRouter()
    return (
        <MotionCard className="border-none shadow-lg overflow-hidden bg-white dark:bg-slate-900 group">
            <CardContent className="p-0">
                <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{biz.name}</h3>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-black border-none">
                                    %{biz.latest_ranking?.score || 0} MapRank
                                </Badge>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                    <span>{biz.total_rating}</span>
                                    <Icons.star className="h-2 w-2 text-amber-400 fill-amber-400" />
                                    <span>• {biz.review_count} Yorum</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(biz.id, biz.name)}
                            className="rounded-xl -mr-2 text-red-400 hover:text-red-600"
                        >
                            <Icons.minus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="w-full rounded-xl h-10 text-[10px] font-black uppercase border-slate-200 dark:border-slate-800 dark:text-slate-300"
                            onClick={() => router.push(`/business/analyze?place_id=${biz.google_place_id}&name=${encodeURIComponent(biz.name)}`)}
                        >
                            Analiz
                        </Button>
                        <Button
                            className="w-full rounded-xl h-10 text-[10px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-none"
                            onClick={() => router.push(`/business/benchmarking?id=${biz.id}`)}
                        >
                            Kıyasla
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full col-span-2 rounded-xl h-10 text-[10px] font-black uppercase border-indigo-200 dark:border-indigo-900/50 text-indigo-600"
                            onClick={() => router.push(`/business/reviews?id=${biz.id}`)}
                        >
                            <Icons.messageSquare className="h-3 w-3 mr-2" />
                            Yorum Yanıt Merkezi
                        </Button>
                    </div>
                </div>
            </CardContent>
        </MotionCard>
    )
}

function SmallStatCard({ title, value, unit, icon: Icon, color, bg }: any) {
    return (
        <MotionCard className="border-none shadow-md bg-white dark:bg-slate-900/50">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</p>
                    <div className={`p-2 rounded-xl ${bg} dark:bg-slate-800`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{unit}</span>
                </div>
            </CardContent>
        </MotionCard>
    )
}

function EmptyState({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="p-12 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Icons.activity className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{desc}</p>
        </div>
    )
}
