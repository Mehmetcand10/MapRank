"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MotionCard } from "@/components/ui/motion-card"
import { Icons } from "@/components/icons"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Recommendation {
    type: "critical" | "warning" | "suggestion"
    message: string
}

interface AnalysisResult {
    score: number
    metrics: {
        rating: number
        review_count: number
        sentiment_positive?: number
        sentiment_neutral?: number
        sentiment_negative?: number
        rank_position?: number
        total_competitors?: number
        avg_competitor_rating?: number
    }
    targets: {
        rating: number
        review_count: number
    }
    recommendations: Recommendation[]
    analysis_text: string
    formatted_address?: string
    formatted_phone_number?: string
    website?: string
    photo_url?: string
    validation_status?: string
    competitors?: Competitor[]
    google_place_id?: string
    is_tracked?: boolean
    business_types?: string[]
    // Premium Fields
    sentiment_trends?: { month: string, score: number }[]
    visibility_score?: number
    market_share_estimate?: number
    growth_hacks?: string[]
    // Advanced Metrics
    review_velocity_30d?: number
    owner_response_rate?: number
    response_speed_hours?: number
    photo_count?: number
    profile_completeness_percent?: number
    keyword_relevance_score?: number
    competitor_keywords?: { keyword: string, count: number, impact: string }[]
}

interface Competitor {
    name: string
    rating: number
    user_ratings_total: number
    address: string
    types?: string[]
}

function AnalyzeContent() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<AnalysisResult | null>(null)
    const placeId = searchParams.get("place_id")
    const name = searchParams.get("name")

    useEffect(() => {
        if (!placeId) {
            setError("İşletme kimliği (Place ID) eksik. Lütfen aramayı tekrar yapın.")
            setLoading(false)
            return
        }

        const fetchData = async () => {
            try {
                // Remove trailing slash and use correct endpoint
                const response = await api.post<AnalysisResult>(`/businesses/analyze?place_id=${placeId}`)
                setData(response.data)
            } catch (err: any) {
                console.error("Analysis failed", err)
                const errorMessage = err.response?.data?.detail || err.message || "Bilinmeyen bir hata oluştu."
                setError(errorMessage)
                toast({
                    title: "Hata",
                    description: "Analiz verileri alınamadı: " + errorMessage,
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [placeId])

    const handleSaveBusiness = async () => {
        if (!data || !placeId) return
        setSaving(true)
        try {
            await api.post("/businesses", {
                google_place_id: placeId,
                name: name || data.formatted_address || "Bilinmeyen İşletme",
                address: data.formatted_address,
                total_rating: data.metrics.rating,
                review_count: data.metrics.review_count
            })
            toast({
                title: "Başarılı",
                description: "İşletme takip listenize eklendi.",
            })
            router.push("/dashboard")
        } catch (error: any) {
            console.error("Save failed", error)
            const detail = error.response?.data?.detail

            if (detail === "Business already exists in this tenant") {
                toast({
                    title: "Zaten Kayıtlı",
                    description: "Bu işletme zaten takip listenizde mevcut.",
                })
                router.push("/dashboard")
                return
            }

            toast({
                title: "Hata",
                description: detail || "İşletme kaydedilemedi.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <Icons.spinner className="h-10 w-10 animate-spin text-blue-600" />
                <div className="text-center">
                    <p className="text-lg font-medium text-foreground">Yapay Zeka Analiz Ediyor...</p>
                    <p className="text-sm text-muted-foreground">Rakipler ve pazar verileri taranıyor.</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col h-[50vh] items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-2">
                    <Icons.warning className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-red-500 font-bold text-xl">Analiz Yüklenemedi</div>
                <div className="text-muted-foreground text-center max-w-sm">{error}</div>
                <Button variant="outline" size="lg" onClick={() => router.back()}>Geri Dön ve Tekrar Dene</Button>
            </div>
        )
    }

    if (!data) return <div>Veri bulunamadı.</div>

    return (
        <div className="space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{name || "İşletme Analizi"}</h2>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200">💎 Premium Analiz</Badge>
                    </div>
                    <p className="text-muted-foreground max-w-2xl text-lg flex items-center gap-2">
                        <Icons.mapPin className="h-4 w-4 shrink-0" />
                        {data.formatted_address}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="lg" onClick={() => router.back()} className="rounded-full">
                        <Icons.chevronLeft className="mr-2 h-4 w-4" />
                        Geri
                    </Button>
                    {data.is_tracked ? (
                        <Button variant="secondary" size="lg" onClick={() => router.push("/dashboard")} className="rounded-full bg-green-50 text-green-700 hover:bg-green-100">
                            <Icons.check className="mr-2 h-4 w-4" />
                            Takip Ediliyor
                        </Button>
                    ) : (
                        <Button size="lg" onClick={handleSaveBusiness} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-lg shadow-blue-200">
                            {saving ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : <Icons.plus className="mr-2 h-4 w-4" />}
                            Sisteme Kaydet & Takip Et
                        </Button>
                    )}
                </div>
            </div>

            {/* Advanced Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <MetricCard
                    title="Yorum Hızı (30 Gün)"
                    value={data.review_velocity_30d || 0}
                    unit="y/ay"
                    icon={Icons.trending}
                    progress={Math.min(100, (data.review_velocity_30d || 0) * 5)}
                    footer="Aylık yeni yorum performansı"
                />
                <MetricCard
                    title="Yanıt Oranı"
                    value={data.owner_response_rate || 0}
                    unit="%"
                    icon={Icons.messageSquare}
                    progress={data.owner_response_rate}
                    footer="Müşteri geri bildirimi hızı"
                />
                <MetricCard
                    title="Profil Tamlığı"
                    value={data.profile_completeness_percent || 0}
                    unit="%"
                    icon={Icons.checkCircle}
                    progress={data.profile_completeness_percent}
                    footer="Google Business Profile sağlığı"
                />
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Görünürlük Skoru"
                    value={`%${data.visibility_score}`}
                    sub="Bölgesel Erişim"
                    icon={Icons.activity}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <StatCard
                    title="Pazar Payı (Tahmin)"
                    value={`%${data.market_share_estimate}`}
                    sub="Bölge Dominasyonu"
                    icon={Icons.star}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <StatCard
                    title="Sıralama"
                    value={`#${data.metrics.rank_position || '?'}`}
                    sub={`${data.metrics.total_competitors} Rakip Arasında`}
                    icon={Icons.trophy}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatCard
                    title="Yorum Kalitesi"
                    value={data.metrics.rating.toFixed(1)}
                    sub={`${data.metrics.review_count} Yorum`}
                    icon={Icons.messageSquare}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Score & Heatmap Mockup */}
                <MotionCard delay={0.1} className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                    <CardHeader>
                        <CardTitle className="text-white text-2xl flex items-center justify-between">
                            MapRank Skoru
                            <Icons.activity className="h-6 w-6 text-indigo-400" />
                        </CardTitle>
                        <CardDescription className="text-indigo-200">İşletmenizin 360° dijital performans analizi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-10 py-4">
                            <div className="relative h-48 w-48 flex items-center justify-center">
                                <svg className="h-full w-full transform -rotate-90">
                                    <circle className="text-white/10" strokeWidth="12" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" />
                                    <circle
                                        className="text-indigo-400 transition-all duration-1000 ease-out"
                                        strokeWidth="12"
                                        strokeDasharray={502}
                                        strokeDashoffset={502 - (502 * data.score) / 100}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="80"
                                        cx="96"
                                        cy="96"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-5xl font-black">{data.score}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Skor</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                                    <p className="text-indigo-100 leading-relaxed italic">
                                        "{data.analysis_text}"
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <p className="text-xs text-indigo-300 uppercase font-bold mb-1">Potansiyel Artış</p>
                                        <p className="text-xl font-bold text-green-400">+%15.2</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <p className="text-xs text-indigo-300 uppercase font-bold mb-1">Müşteri Güveni</p>
                                        <p className="text-xl font-bold text-blue-400">Yüksek</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visibility Heatmap Simulation */}
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                    <Icons.globe className="h-4 w-4" />
                                    Stratejik Görünürlük Haritası
                                </h4>
                                <Badge className="bg-indigo-500/20 text-indigo-200 border-none text-[10px]">Canlı Simülasyon</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 h-64 rounded-2xl bg-slate-800 relative overflow-hidden border border-white/5 shadow-inner">
                                    {/* Mock Map Background */}
                                    <div className="absolute inset-0 opacity-30 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/0,0,1/600x400?access_token=none')] bg-cover"></div>

                                    {/* Heatmap Hotspots */}
                                    <div className="absolute top-1/4 left-1/3 h-24 w-24 bg-indigo-500 rounded-full blur-[60px] opacity-60 animate-pulse"></div>
                                    <div className="absolute top-1/2 left-2/3 h-16 w-16 bg-blue-400 rounded-full blur-[40px] opacity-40 animate-pulse delay-700"></div>
                                    <div className="absolute bottom-1/4 left-1/4 h-20 w-20 bg-emerald-400 rounded-full blur-[50px] opacity-30 animate-pulse delay-500"></div>

                                    {/* Location Pins */}
                                    <div className="absolute top-1/4 left-1/3 -ml-2 -mt-2">
                                        <div className="h-4 w-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 text-[10px] space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                            <span>Yüksek Görünürlük</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                                            <span>Fırsat Bölgesi</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <h5 className="text-xs font-bold text-indigo-300 uppercase mb-2">Büyüme Fırsatı</h5>
                                        <p className="text-sm font-medium">Beşiktaş / Ortaköy hattında rakip yoğunluğu düşük. %22 daha fazla trafik potansiyeli!</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <h5 className="text-xs font-bold text-emerald-400 uppercase mb-2">Kritik Bölge</h5>
                                        <p className="text-sm font-medium">Kadıköy Merkez bölgesinde 3 ana rakibiniz çok güçlü. Etkileşimi artırmalısınız.</p>
                                    </div>
                                    <Button variant="outline" className="w-full text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10 h-8 text-xs">
                                        Detaylı Isı Haritası (Cebinizde)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </MotionCard>

                {/* Growth Hacks Sidebar */}
                <MotionCard delay={0.3} className="border-indigo-100 bg-indigo-50/30">
                    <CardHeader>
                        <CardTitle className="text-indigo-900 flex items-center gap-2">
                            <Icons.bot className="h-5 w-5 text-indigo-600" />
                            Stratejik Yol Haritası
                        </CardTitle>
                        <CardDescription>Sıralamanızı uçuracak yapay zeka ipuçları.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.growth_hacks?.map((hack, i) => (
                            <div key={i} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm flex gap-3 group hover:border-indigo-300 transition-colors">
                                <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] font-black group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-slate-700 leading-tight font-medium">{hack}</p>
                            </div>
                        ))}
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2">
                            Tam Raporu İndir (PDF)
                        </Button>
                    </CardContent>
                </MotionCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* AI Growth Engine - Keyword Analysis */}
                <MotionCard delay={0.4} className="lg:col-span-1 border-emerald-100 bg-emerald-50/20">
                    <CardHeader>
                        <CardTitle className="text-emerald-900 flex items-center gap-2">
                            <Icons.search className="h-5 w-5 text-emerald-600" />
                            AI Rakip Kelime Analizi
                        </CardTitle>
                        <CardDescription>Rakiplerinizin en çok etkileşim aldığı kelimeler.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.competitor_keywords?.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-slate-800">"{item.keyword}"</p>
                                    <p className="text-[10px] text-slate-500">{item.count} yorumda geçiyor</p>
                                </div>
                                <Badge className={
                                    item.impact === 'Yüksek' ? 'bg-emerald-500' :
                                        item.impact === 'Orta' ? 'bg-blue-500' : 'bg-slate-500'
                                }>
                                    {item.impact}
                                </Badge>
                            </div>
                        ))}
                        <div className="pt-2">
                            <p className="text-[10px] text-emerald-700 italic">
                                * Bu kelimeleri yanıtlarınızda kullanarak görünürlüğünüzü artırabilirsiniz.
                            </p>
                        </div>
                    </CardContent>
                </MotionCard>

                {/* Automatic Competitor Discovery */}
                <MotionCard delay={0.5} className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Icons.store className="h-5 w-5 text-blue-600" />
                            Otomatik Rakip Keşfi
                        </CardTitle>
                        <CardDescription>Bölgenizdeki en güçlü 5 rakip ve performans kıyaslaması.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.competitors?.map((comp, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{comp.name}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{comp.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Icons.star className="h-3 w-3 fill-current" />
                                                <span className="text-sm font-bold">{comp.rating}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400">{comp.user_ratings_total} yorum</p>
                                        </div>
                                        <Badge variant="outline" className="border-blue-200 text-blue-600">
                                            Rakip
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </MotionCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Sentiment & Trends */}
                <MotionCard delay={0.4}>
                    <CardHeader>
                        <CardTitle>Müşteri Deneyimi Trendi</CardTitle>
                        <CardDescription>Son 3 aydaki dijital memnuniyet değişimi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.sentiment_trends || []}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-around mt-4 pt-4 border-t border-slate-100">
                            <SentimentStat label="Olumlu" value={data.metrics.sentiment_positive} color="bg-green-500" />
                            <SentimentStat label="Nötr" value={data.metrics.sentiment_neutral} color="bg-slate-400" />
                            <SentimentStat label="Olumsuz" value={data.metrics.sentiment_negative} color="bg-red-500" />
                        </div>
                    </CardContent>
                </MotionCard>

                {/* Recommendations */}
                <MotionCard delay={0.5}>
                    <CardHeader>
                        <CardTitle>Eylem Planı</CardTitle>
                        <CardDescription>Bugün yapabileceğiniz kritik iyileştirmeler.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.recommendations.map((rec, i) => (
                            <div key={i} className={`flex gap-3 p-4 rounded-xl border-l-4 ${rec.type === 'critical' ? 'bg-red-50 border-red-500' :
                                rec.type === 'warning' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'
                                }`}>
                                {rec.type === 'critical' ? <Icons.warning className="h-5 w-5 text-red-600 shrink-0" /> : <Icons.alertCircle className="h-5 w-5 text-amber-600 shrink-0" />}
                                <p className="text-sm font-medium text-slate-800">{rec.message}</p>
                            </div>
                        ))}
                    </CardContent>
                </MotionCard>
            </div>
        </div>
    )
}

function MetricCard({ title, value, unit, icon: Icon, progress, footer }: any) {
    return (
        <MotionCard className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
                            <span className="text-sm font-bold text-slate-400">{unit}</span>
                        </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-indigo-400">
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-[10px] font-medium text-slate-400 italic">
                        {footer}
                    </p>
                </div>
            </CardContent>
        </MotionCard>
    )
}

function StatCard({ title, value, sub, icon: Icon, color, bg }: any) {
    return (
        <MotionCard className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${bg}`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-2xl font-black tracking-tight">{value}</p>
                    <p className="text-sm font-bold text-slate-900">{title}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
            </CardContent>
        </MotionCard>
    )
}

function SentimentStat({ label, value, color }: any) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-muted-foreground mb-1">{label}</span>
            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${color}`} />
                <span className="font-bold text-slate-900">%{value}</span>
            </div>
        </div>
    )
}

export default function AnalyzePage() {
    return (
        <Suspense fallback={<div className="flex h-[80vh] items-center justify-center flex-col gap-4">
            <Icons.spinner className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">İşletme verileri analiz ediliyor...</p>
        </div>}>
            <AnalyzeContent />
        </Suspense>
    )
}
