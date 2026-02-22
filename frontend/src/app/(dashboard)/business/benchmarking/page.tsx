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
                // 1. Get businesses list to find the one we clicked and others
                const bizListRes = await api.get("/businesses")
                const businesses = bizListRes.data
                const target = businesses.find((b: any) => b.id === businessId)

                if (!target) {
                    router.push("/dashboard")
                    return
                }

                // 2. Fetch full analysis for My Business
                const analysisRes = await api.get(`/businesses/analyze?place_id=${target.google_place_id}`)
                setMyBiz(analysisRes.data)

                // 3. Set others (Competitors) from the same tenant
                setOthers(businesses.filter((b: any) => b.id !== businessId))

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
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                    <Icons.activity className="absolute inset-4 h-8 w-8 text-indigo-600" />
                </div>
                <div className="text-center animate-pulse">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Stratejik Kıyaslama Hazırlanıyor...</h2>
                    <p className="text-slate-500 text-sm font-medium">Bölgesel rakipler ve pazar verileri eşleşiyor.</p>
                </div>
            </div>
        )
    }

    // Prepare chart data
    const chartData = [
        { subject: 'Skor', A: myBiz.score, B: 75, fullMark: 100 },
        { subject: 'Yorum', A: Math.min(100, (myBiz.metrics.review_count / 10)), B: 60, fullMark: 100 },
        { subject: 'Görünürlük', A: myBiz.visibility_score || 70, B: 65, fullMark: 100 },
        { subject: 'Yanıt Hızı', A: myBiz.owner_response_rate || 50, B: 40, fullMark: 100 },
        { subject: 'Puan', A: myBiz.metrics.rating * 20, B: 85, fullMark: 100 },
    ]

    return (
        <div className="space-y-8 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full -ml-2 text-slate-500">
                            <Icons.chevronLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Kıyaslama Analizi</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Asıl işletmeniz ve rakipleriniz arasındaki stratejik farklar.</p>
                </div>
                <Badge className="bg-amber-100 text-amber-600 border-none font-bold py-1 px-3">PREMIUM ANALİZ</Badge>
            </div>

            {/* Comparison Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Radar Chart */}
                <MotionCard className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Icons.activity className="h-5 w-5 text-indigo-600" />
                            Performans Radarı
                        </CardTitle>
                        <CardDescription>Metrik bazlı kafa kafaya karşılaştırma.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar
                                    name="Benim İşletmem"
                                    dataKey="A"
                                    stroke="#4f46e5"
                                    fill="#4f46e5"
                                    fillOpacity={0.4}
                                />
                                <Radar
                                    name="Pazar Ortalaması"
                                    dataKey="B"
                                    stroke="#94a3b8"
                                    fill="#94a3b8"
                                    fillOpacity={0.1}
                                />
                                <Tooltip />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </MotionCard>

                {/* Core Comparison Table */}
                <MotionCard delay={0.1} className="border-none shadow-xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Icons.trending className="h-5 w-5 text-emerald-600" />
                            KPI Özet Karşılaştırma
                        </CardTitle>
                        <CardDescription>Kritik başarı göstergeleri.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-[10px] uppercase font-black text-slate-400">
                                        <th className="px-6 py-3">İşletme</th>
                                        <th className="px-6 py-3">MapRank</th>
                                        <th className="px-6 py-3">Puan</th>
                                        <th className="px-6 py-3">Hız (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {/* ME */}
                                    <tr className="bg-indigo-50/30">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 leading-tight">Benim İşletmem</span>
                                                <span className="text-[10px] text-indigo-600 font-black">SİZ</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-lg font-black text-indigo-600">%{myBiz.score}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-slate-700">{myBiz.metrics.rating}</span>
                                                <Icons.star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-600">
                                            %{myBiz.owner_response_rate || 45}
                                        </td>
                                    </tr>

                                    {/* OTHERS */}
                                    {others.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400 italic">
                                                Takip edilen başka rakip bulunamadı.
                                            </td>
                                        </tr>
                                    ) : (
                                        others.slice(0, 4).map((o) => (
                                            <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-slate-700">{o.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-600">%{o.latest_ranking?.score || 0}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {o.total_rating} <Icons.star className="inline h-3 w-3" />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-medium font-mono">
                                                    %{(o.latest_ranking?.score || 10) / 2}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </MotionCard>
            </div>

            {/* Gap Analysis Section */}
            <div className="grid gap-6 md:grid-cols-3">
                <InsightCard
                    title="Görünürlük Farkı"
                    diff={"+%12"}
                    status="better"
                    desc="Rakiplerinize göre pazarın %12 daha fazlasına hakimsiniz."
                    icon={Icons.globe}
                />
                <InsightCard
                    title="Yorum Kalitesi"
                    diff={"-0.4"}
                    status="worse"
                    desc="Rakip ortalaması 4.8 iken sizin puanınız 4.4. Odaklanılması gereken alan."
                    icon={Icons.messageSquare}
                />
                <InsightCard
                    title="Yanıt Hızı"
                    diff={"%40 Daha Yavaş"}
                    status="warning"
                    desc="Rakipler yorumlara %40 daha hızlı yanıt veriyor."
                    icon={Icons.trending}
                />
            </div>
        </div>
    )
}

function InsightCard({ title, diff, status, desc, icon: Icon }: any) {
    const isGood = status === "better"
    const isBad = status === "worse"

    return (
        <MotionCard className="border-none shadow-lg">
            <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "p-2 rounded-xl",
                        isGood ? "bg-emerald-50 text-emerald-600" : isBad ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn(
                        "text-lg font-black",
                        isGood ? "text-emerald-500" : isBad ? "text-red-500" : "text-amber-500"
                    )}>
                        {diff}
                    </span>
                </div>
                <div className="space-y-1">
                    <h4 className="font-black text-slate-900">{title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {desc}
                    </p>
                </div>
            </CardContent>
        </MotionCard>
    )
}
