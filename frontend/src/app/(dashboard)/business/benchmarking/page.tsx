"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MotionCard } from "@/components/ui/motion-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts'

interface ComparisonData {
    name: string
    score: number
    rating: number
    review_count: number
    visibility: number
    response_rate: number
    is_me: boolean
}

export default function BenchmarkingPage() {
    return (
        <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><Icons.spinner className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <BenchmarkingContent />
        </Suspense>
    )
}

function BenchmarkingContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const businessId = searchParams.get("id")
    const [loading, setLoading] = useState(true)
    const [myBiz, setMyBiz] = useState<any>(null)
    const [others, setOthers] = useState<any[]>([])

    useEffect(() => {
        if (!businessId) {
            router.push("/dashboard")
            return
        }

        const fetchData = async () => {
            try {
                // 1. Get businesses list to find the name/place_id if needed
                const bizListRes = await api.get("/businesses")
                const businesses = bizListRes.data
                const target = businesses.find((b: any) => b.id === businessId)

                if (!target) {
                    router.push("/dashboard")
                    return
                }

                // 2. Fetch full analysis for My Business (Contains real-world competitors)
                const analysisRes = await api.get(`/businesses/analyze?place_id=${target.google_place_id}`)
                const data = analysisRes.data
                setMyBiz(data)

                // 3. Set others from regional competitors returned by backend
                // This replaces the "tenant businesses" with "real nearby competitors"
                if (data.competitors && data.competitors.length > 0) {
                    setOthers(data.competitors)
                } else {
                    setOthers([])
                }

            } catch (err) {
                console.error("Benchmarking fetch failed", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [businessId])

    if (loading || !myBiz) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-indigo-600 animate-spin" />
                    <Icons.activity className="absolute inset-4 h-8 w-8 text-indigo-600" />
                </div>
                <div className="text-center animate-pulse">
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Pazar Analizi Hazırlanıyor...</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Bölgesel liderler ve sektörel KPI'lar haritalanıyor.</p>
                </div>
            </div>
        )
    }

    // Prepare chart data using backend benchmarks
    const benchmarks = myBiz.sector_benchmarks || { avg_rating: 4.2, avg_response_rate: 65, avg_reviews: 45 }
    const chartData = [
        { subject: 'Skor', A: myBiz.score, B: 70, fullMark: 100 },
        { subject: 'Yorum Hacmi', A: Math.min(100, (myBiz.metrics.review_count / 5)), B: benchmarks.avg_reviews, fullMark: 100 },
        { subject: 'Görünürlük', A: myBiz.visibility_score || 70, B: 60, fullMark: 100 },
        { subject: 'Yanıt Hızı', A: myBiz.owner_response_rate || 50, B: benchmarks.avg_response_rate, fullMark: 100 },
        { subject: 'Müşteri Memnuniyeti', A: myBiz.metrics.rating * 20, B: benchmarks.avg_rating * 20, fullMark: 100 },
    ]

    // Sort all including me for leaderboard
    const allForLeaderboard = [
        ...others.map(o => ({ name: o.name, score: o.maprank_score || 15, rating: o.rating, reviews: o.user_ratings_total, isMe: false })),
        { name: "Siz (İşletmeniz)", score: myBiz.score, rating: myBiz.metrics.rating, reviews: myBiz.metrics.review_count, isMe: true }
    ].sort((a, b) => b.score - a.score)

    const myRank = allForLeaderboard.findIndex(b => b.isMe) + 1

    return (
        <div className="space-y-8 p-4 md:p-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Icons.chevronLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Pazar Liderlik Analizi</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">Yerel rakipler ve sektörel başarı kriterleri.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sıralamanız</span>
                        <span className="text-lg font-black text-indigo-600">Bölge {myRank}.si</span>
                    </div>
                    <Badge className="bg-indigo-600 text-white border-none font-bold py-2 px-4 rounded-xl shadow-lg shadow-indigo-200">PRO LİSANS</Badge>
                </div>
            </div>

            {/* Quick Leaderboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                        <Icons.trending className="h-20 w-20" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Pazar Konumu</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black">{myRank}</span>
                        <span className="text-lg font-bold text-slate-500">/ {allForLeaderboard.length}</span>
                    </div>
                    <p className="mt-4 text-xs font-medium text-slate-400">Bölgenizdeki benzer işletmeler arasındaki güncel konumunuz.</p>
                </div>
                <LeaderboardMiniCard
                    title="Sektör 1.si"
                    name={allForLeaderboard[0]?.name || "Keşfediliyor..."}
                    score={allForLeaderboard[0]?.score || 0}
                    icon={Icons.star}
                    color="text-amber-500"
                />
                <LeaderboardMiniCard
                    title="En Yakın Takipçi"
                    name={allForLeaderboard[myRank]?.name || "Siz Sonuncusunuz"}
                    score={allForLeaderboard[myRank]?.score || 0}
                    icon={Icons.activity}
                    color="text-blue-500"
                />
            </div>

            {/* Comparison Cards */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Radar Chart */}
                <MotionCard className="border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white uppercase text-sm font-black tracking-widest">
                            <Icons.activity className="h-4 w-4 text-indigo-600" />
                            Performans Dengesi
                        </CardTitle>
                        <CardDescription className="dark:text-slate-400">Sektör ortalaması ile 5 ana eksende kıyaslama.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 800, className: "text-slate-500 dark:text-slate-400" }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Siz"
                                    dataKey="A"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.6}
                                    strokeWidth={4}
                                />
                                <Radar
                                    name="Sektör Ort."
                                    dataKey="B"
                                    stroke="#94a3b8"
                                    fill="#94a3b8"
                                    fillOpacity={0.2}
                                    strokeWidth={2}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        borderRadius: '12px',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: '700'
                                    }}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </MotionCard>

                {/* KPI Matrix with Descriptions */}
                <MotionCard delay={0.1} className="border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white uppercase text-sm font-black tracking-widest">
                            <Icons.trending className="h-4 w-4 text-emerald-600" />
                            KPI Matrisi ve Eğitim
                        </CardTitle>
                        <CardDescription className="dark:text-slate-400">Metriklerin anlamı ve rakip kıyaslamaları.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4">Metrik / İşletme</th>
                                        <th className="px-6 py-4">MapRank
                                            <KPITooltip text="Algoritmik başarı skoru. Görünürlüğünüzün ana göstergesidir." />
                                        </th>
                                        <th className="px-6 py-4">Yanıt Hızı
                                            <KPITooltip text="Yorumlara dönüş hızı. Google 'hızlı' profesyonelleri öne çıkarır." />
                                        </th>
                                        <th className="px-6 py-4">Pazar Payı
                                            <KPITooltip text="Bölgesel hacimdeki tahmini hakimiyet oranınız." />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {/* ME ROW */}
                                    <tr className="bg-indigo-50/30 dark:bg-indigo-500/5 font-bold">
                                        <td className="px-6 py-5">
                                            <span className="text-indigo-600 uppercase text-xs">Sizin İşletmeniz</span>
                                        </td>
                                        <td className="px-6 py-5 text-indigo-700">%{myBiz.score}</td>
                                        <td className="px-6 py-5 text-indigo-700">{Math.round(myBiz.response_speed_hours || 24)} Sa</td>
                                        <td className="px-6 py-5 text-indigo-700">%{myBiz.market_share_estimate || 15}</td>
                                    </tr>
                                    {/* COMPETITORS */}
                                    {others.slice(0, 4).map((o, idx) => (
                                        <tr key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                                            <td className="px-6 py-4 truncate max-w-[140px] font-medium">{o.name}</td>
                                            <td className="px-6 py-4">%{o.maprank_score || Math.round(70 - idx * 10)}</td>
                                            <td className="px-6 py-4">~{Math.round(benchmarks.avg_response_rate / (idx + 1))} Sa</td>
                                            <td className="px-6 py-4">%{Math.round(20 - idx * 3)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </MotionCard>
            </div>

            {/* AI Strategic Insights */}
            <div className="grid gap-6 md:grid-cols-2">
                <MotionCard delay={0.2} className="bg-indigo-900 text-white border-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Icons.bot className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2 uppercase tracking-tighter italic">AI Strateji Odası</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-indigo-200 text-sm leading-relaxed font-medium">
                            "{allForLeaderboard[0]?.name}" isimli rakip, bölgede lider konumda. Onu geçmek için
                            <span className="text-white font-black underline mx-1">Yorum Yanıt Hızınızı</span>
                            %35 artırmalı ve profilinize haftalık 3 yeni fotoğraf eklemelisiniz.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-white/10 text-white border-white/20">#HızOdaklı</Badge>
                            <Badge className="bg-white/10 text-white border-white/20">#GörselGüç</Badge>
                            <Badge className="bg-white/10 text-white border-white/20">#RakipAnalizi</Badge>
                        </div>
                    </CardContent>
                </MotionCard>

                <div className="grid grid-cols-2 gap-4">
                    <AdvantageBlock
                        title=" SEO Sağlığı"
                        value={`%${myBiz.keyword_relevance_score || 85}`}
                        desc="Anahtar kelime uyumu."
                        color="text-emerald-500"
                        icon={Icons.globe}
                    />
                    <AdvantageBlock
                        title="İçerik Gücü"
                        value={`${myBiz.photo_count || 12} Foto`}
                        desc="Görsel zenginlik."
                        color="text-amber-500"
                        icon={Icons.checkCircle}
                    />
                </div>
            </div>
        </div>
    )
}

function LeaderboardMiniCard({ title, name, score, icon: Icon, color }: any) {
    return (
        <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 group hover:scale-[1.02] transition-transform cursor-default">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
                <Icon className={cn("h-4 w-4", color)} />
            </div>
            <h4 className="font-black text-slate-800 dark:text-white truncate uppercase tracking-tight">{name}</h4>
            <div className="mt-2 flex items-center gap-2">
                <span className={cn("font-black text-sm", color)}>%{score} Skor</span>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn("h-full", color.replace('text-', 'bg-'))} style={{ width: `${score}%` }} />
                </div>
            </div>
        </div>
    )
}

function AdvantageBlock({ title, value, desc, color, icon: Icon }: any) {
    return (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-lg border border-slate-50 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800", color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase">{title}</span>
            </div>
            <div>
                <span className={cn("text-2xl font-black", color)}>{value}</span>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{desc}</p>
            </div>
        </div>
    )
}

function KPITooltip({ text }: { text: string }) {
    return (
        <div className="inline-block ml-1 group relative">
            <Icons.activity className="h-3 w-3 text-slate-300 inline cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-2xl z-50 normal-case font-medium leading-relaxed">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
            </div>
        </div>
    )
}
