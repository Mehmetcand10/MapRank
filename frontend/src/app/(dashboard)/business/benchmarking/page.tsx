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
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-indigo-600 animate-spin" />
                    <Icons.activity className="absolute inset-4 h-8 w-8 text-indigo-600" />
                </div>
                <div className="text-center animate-pulse">
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Stratejik Kıyaslama Hazırlanıyor...</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Bölgesel rakipler ve pazar verileri eşleşiyor.</p>
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
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Icons.chevronLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Kıyaslama Analizi</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Asıl işletmeniz ve rakipleriniz arasındaki stratejik farklar.</p>
                </div>
                <Badge className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-bold py-1 px-3">PREMIUM ANALİZ</Badge>
            </div>

            {/* Comparison Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Radar Chart */}
                <MotionCard className="border-none shadow-2xl overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl ring-1 ring-white/20">
                    <CardHeader className="relative z-10">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Icons.activity className="h-24 w-24" />
                        </div>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                                <Icons.activity className="h-5 w-5" />
                            </div>
                            Performans Radarı
                        </CardTitle>
                        <CardDescription className="dark:text-slate-400">Metrik bazlı kafa kafaya karşılaştırma.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700, className: "text-slate-500 dark:text-slate-400" }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Sizin İşletmeniz"
                                    dataKey="A"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.5}
                                    strokeWidth={3}
                                />
                                <Radar
                                    name="Pazar Ortalaması"
                                    dataKey="B"
                                    stroke="#94a3b8"
                                    fill="#94a3b8"
                                    fillOpacity={0.15}
                                    strokeWidth={2}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </MotionCard>

                {/* Core Comparison Table */}
                <MotionCard delay={0.1} className="border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50">
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                                <Icons.trending className="h-5 w-5" />
                            </div>
                            KPI Karşılaştırma Matrisi
                        </CardTitle>
                        <CardDescription className="dark:text-slate-400">Sektörel başarı kriterleri üzerinden kitle analizi.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">
                                        <th className="px-6 py-4">İşletme</th>
                                        <th className="px-6 py-4">MapRank</th>
                                        <th className="px-6 py-4">Yorum Sağlığı</th>
                                        <th className="px-6 py-4">Pazar Payı</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {/* ME */}
                                    <tr className="bg-indigo-50/40 dark:bg-indigo-500/5 relative overflow-hidden group">
                                        <td className="px-6 py-5 relative z-10">
                                            <div className="flex flex-col">
                                                <span className="font-black text-indigo-900 dark:text-indigo-400 leading-tight uppercase tracking-tighter">İşletmeniz</span>
                                                <span className="text-[9px] text-indigo-600 font-bold bg-indigo-100 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded mt-1 w-fit">REFERANS</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-black text-indigo-600">%{myBiz.score}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 relative z-10">
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex -space-x-1">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Icons.star key={s} className={cn("h-3 w-3", s <= Math.round(myBiz.metrics.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                                                    ))}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">({myBiz.metrics.review_count})</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 relative z-10">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-[10px] font-black">
                                                    <span className="text-emerald-600">%{myBiz.visibility_score || 65}</span>
                                                </div>
                                                <div className="w-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${myBiz.visibility_score || 65}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* OTHERS */}
                                    {others.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 opacity-40">
                                                    <Icons.activity className="h-8 w-8" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Kıyaslanacak rakip veri kümesi bulunamadı.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        others.slice(0, 5).map((o) => (
                                            <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{o.name}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="font-black text-slate-500 dark:text-slate-500">%{o.latest_ranking?.score || 15}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-1 text-slate-400">
                                                        <span className="text-xs font-bold">{o.total_rating || 0}</span>
                                                        <Icons.star className="h-2.5 w-2.5" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden opacity-50">
                                                        <div className="h-full bg-slate-400" style={{ width: `${(o.latest_ranking?.score || 10)}%` }} />
                                                    </div>
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

            {/* AI Advantage Analysis - NEW SECTION */}
            <MotionCard delay={0.2} className="border-none shadow-2xl bg-indigo-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -ml-32 -mb-32" />

                <CardHeader className="relative z-10 border-b border-white/10">
                    <CardTitle className="flex items-center gap-3 text-2xl font-black">
                        <Icons.bot className="h-8 w-8 text-indigo-300" />
                        Yapay Zeka Stratejik Açık Analizi
                    </CardTitle>
                    <CardDescription className="text-indigo-200 font-medium text-base">
                        Rakiplerinizle aranızdaki performans boşluklarını kapatmak için AI önerileri.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 relative z-10">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        <AdvantageBlock
                            title="Yorum Hızı"
                            value="KRİTİK AÇIK"
                            desc="En yakın rakibiniz yorumlara 2 saat içinde dönerken sizin süreniz 48 saati buluyor."
                            color="text-red-400"
                            icon={Icons.activity}
                        />
                        <AdvantageBlock
                            title="SEO Görünürlüğü"
                            value="Pazar Lideri"
                            desc="Sektördeki 12 anahtar kelimenin 9'unda ilk 3'tesiniz. Mevziyi koruyun."
                            color="text-emerald-400"
                            icon={Icons.globe}
                        />
                        <AdvantageBlock
                            title="İçerik Kalitesi"
                            value="Geliştirilmeli"
                            desc="Rakip işletmeler haftalık 3 yeni fotoğraf eklerken siz aylık 1 içerik paylaşıyorsunuz."
                            color="text-amber-400"
                            icon={Icons.star}
                        />
                        <AdvantageBlock
                            title="Puan Kararlılığı"
                            value="Mükemmel"
                            desc="Son 6 aydır puanınız 4.8 bandında sabit kalmış. Müşteri memnuniyeti çok yüksek."
                            color="text-blue-400"
                            icon={Icons.checkCircle}
                        />
                    </div>
                </CardContent>
            </MotionCard>

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

function AdvantageBlock({ title, value, desc, color, icon: Icon }: any) {
    return (
        <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
                <Icon className={cn("h-5 w-5", color)} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", color)}>{value}</span>
            </div>
            <h4 className="font-bold text-lg">{title}</h4>
            <p className="text-xs text-indigo-100/70 leading-relaxed font-medium">{desc}</p>
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
