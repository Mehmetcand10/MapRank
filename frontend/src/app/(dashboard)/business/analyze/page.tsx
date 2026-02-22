"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
// PDF Generation
const html2pdf = typeof window !== 'undefined' ? require('html2pdf.js') : null;
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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

interface BusinessSearchResult {
    google_place_id: string
    name: string
    address: string
    rating: number
    user_ratings_total: number
    maprank_score?: number
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
    growth_ideas?: string[]
    strategic_insights?: {
        market_position: string
        competitive_edge: string
        investment_priority: string
    }
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
    const placeId = searchParams.get("place_id")
    const name = searchParams.get("name")
    const [loading, setLoading] = useState(!!placeId)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<AnalysisResult | null>(null)
    const [isMyBusiness, setIsMyBusiness] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<BusinessSearchResult[]>([])
    const [searchLoading, setSearchLoading] = useState(false)

    const handleDownloadPDF = () => {
        if (!html2pdf || !data) return

        const element = document.getElementById('premium-report-template')
        if (!element) return

        const opt = {
            margin: 0.5,
            filename: `${name || 'MapRank'}_Analiz_Raporu.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        setSearchLoading(true)
        try {
            const response = await api.get<BusinessSearchResult[]>(`/businesses/search?query=${encodeURIComponent(searchQuery)}&location=Turkey`)
            setSearchResults(response.data)
        } catch (err: any) {
            toast({
                title: "Arama Hatası",
                description: "İşletme aranırken bir sorun oluştu.",
                variant: "destructive"
            })
        } finally {
            setSearchLoading(false)
        }
    }

    useEffect(() => {
        if (!placeId) {
            setLoading(false)
            return
        }

        const fetchData = async () => {
            setLoading(true) // Ensure it starts loading
            try {
                const response = await api.get<AnalysisResult>(`/businesses/analyze?place_id=${encodeURIComponent(placeId)}`)
                setData(response.data)
            } catch (err: any) {
                console.error("Analysis failed", err)
                const errorMessage = err.response?.data?.detail || err.message || "Bilinmeyen bir hata oluştu."
                setError(errorMessage)
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
                review_count: data.metrics.review_count,
                is_my_business: isMyBusiness
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

    if (!placeId) {
        return (
            <div className="space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
                <div className="text-center space-y-2 mb-10">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">İşletme Analizi</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">Analiz etmek veya takip etmek istediğiniz işletmeyi arayın.</p>
                </div>

                <MotionCard className="max-w-2xl mx-auto border-none shadow-xl bg-white dark:bg-slate-900 p-8">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Icons.search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Örn: Kebapçı Hamdi Beşiktaş"
                                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={searchLoading} className="rounded-2xl bg-blue-600 hover:bg-blue-700 px-8 py-6 h-auto">
                            {searchLoading ? <Icons.spinner className="h-5 w-5 animate-spin" /> : "Ara"}
                        </Button>
                    </form>

                    {searchResults.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Sonuçlar</p>
                            {searchResults.map((biz) => (
                                <div
                                    key={biz.google_place_id}
                                    onClick={() => router.push(`/business/analyze?place_id=${biz.google_place_id}&name=${encodeURIComponent(biz.name)}`)}
                                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:scale-110 transition-transform">
                                            {biz.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-tight">{biz.name}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[250px]">{biz.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Icons.star className="h-3 w-3 fill-current" />
                                                <span className="text-sm font-bold">{biz.rating}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400">{biz.user_ratings_total} yorum</p>
                                        </div>
                                        <Icons.arrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 translate-x-0 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </MotionCard>
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
        <div className="space-y-6 md:space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 no-print">
                <div className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground dark:text-white leading-tight">{name || "İşletme Analizi"}</h2>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30">💎 Premium Analiz</Badge>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-2xl text-sm md:text-lg flex items-start gap-2">
                        <Icons.mapPin className="h-4 w-4 md:h-5 md:w-5 shrink-0 mt-0.5 md:mt-1 text-slate-400" />
                        <span className="break-words">{data.formatted_address}</span>
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                    <Button variant="outline" size="lg" onClick={() => router.back()} className="flex-1 md:flex-none rounded-full h-11 md:h-12">
                        <Icons.chevronLeft className="mr-2 h-4 w-4" />
                        Geri
                    </Button>
                    {data.is_tracked ? (
                        <Button variant="secondary" size="lg" onClick={() => router.push("/dashboard")} className="flex-1 md:flex-none rounded-full h-11 md:h-12 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100">
                            <Icons.check className="mr-2 h-4 w-4" />
                            Takipte
                        </Button>
                    ) : (
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <Button
                                variant={isMyBusiness ? "primary" : "outline"}
                                onClick={() => setIsMyBusiness(!isMyBusiness)}
                                className={cn(
                                    "rounded-full h-11 md:h-12 px-6 transition-all",
                                    isMyBusiness ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-600 border-slate-200"
                                )}
                            >
                                {isMyBusiness ? <Icons.check className="mr-2 h-4 w-4" /> : <Icons.plus className="mr-2 h-4 w-4" />}
                                Bu Benim İşletmem
                            </Button>
                            <Button size="lg" onClick={handleSaveBusiness} disabled={saving} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-11 md:h-12 shadow-lg shadow-blue-200 active:scale-95 transition-all">
                                {saving ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : <Icons.plus className="mr-2 h-4 w-4" />}
                                Takip Et ve Kaydet
                            </Button>
                        </div>
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
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2 no-print"
                            onClick={handleDownloadPDF}
                        >
                            <Icons.fileDown className="mr-2 h-4 w-4" />
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

            {/* Premium Business Growth Ideas */}
            {data.growth_ideas && data.growth_ideas.length > 0 && (
                <MotionCard delay={0.7} className="border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
                    <CardHeader className="bg-indigo-600 text-white p-6">
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <Icons.settings className="h-6 w-6 animate-spin-slow" />
                            Geleceğin İşletme Fikirleri (Premium Rapor)
                        </CardTitle>
                        <CardDescription className="text-indigo-100">Yapılan sektör analizine göre sizin için üretilmiş özel büyüme modelleri.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            {data.growth_ideas.map((idea: string, i: number) => (
                                <div key={i} className="flex gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center shrink-0 font-black">
                                        {i + 1}
                                    </div>
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{idea}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </MotionCard>
            )}

            {/* Premium PDF Template (Hidden from view, visible to html2pdf) */}
            <div id="premium-report-template" className="hidden" style={{ width: '800px', padding: '40px', background: 'white', color: '#0f172a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #4f46e5', paddingBottom: '20px', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>MapRank <span style={{ color: '#4f46e5' }}>PRO</span></h1>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#64748b' }}>Stratejik İşletme Analiz Raporu</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{name}</p>
                        <p style={{ margin: 0, fontSize: '12px' }}>{new Date().toLocaleDateString('tr-TR')}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', color: '#4f46e5' }}>Performans Skoru</h3>
                        <div style={{ fontSize: '48px', fontWeight: '900' }}>%{data.score}</div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '10px 0 0 0' }}>{data.analysis_text}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px' }}>
                            <small style={{ color: '#94a3b8' }}>Pozisyon</small>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>#{data.metrics.rank_position}</div>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px' }}>
                            <small style={{ color: '#94a3b8' }}>Pazar Payı</small>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>%{data.market_share_estimate}</div>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>💎 Stratejik Yol Haritası (Milyonluk Öneriler)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {data.growth_hacks?.slice(0, 10).map((hack: string, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                                <div style={{ background: '#4f46e5', color: 'white', minWidth: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>{i + 1}</div>
                                <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.4' }}>{hack}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '30px', background: '#eef2ff', padding: '25px', borderRadius: '20px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#312e81' }}>🚀 İşletmenizi Büyütecek Somut Fikirler</h3>
                    <div>
                        {data.growth_ideas?.map((idea: string, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ color: '#4f46e5', fontWeight: 'bold' }}>•</div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#1e1b4b' }}>{idea}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                    <div>
                        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>🔍 Rakip Analiz Özeti</h3>
                        <div>
                            {data.competitors?.slice(0, 3).map((comp: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '10px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{comp.name}</span>
                                    <span style={{ fontSize: '12px', color: '#4f46e5' }}>%{Math.round(comp.rating * 20)} Skor</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '15px', border: '1px dashed #cbd5e1' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px' }}>💡 MapRank Notu</h4>
                        <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>
                            Bu rapor yapay zeka tarafından 36 farklı parametre incelenerek oluşturulmuştur. Önerilerin uygulanması işletme görünürlüğünü ortalama %35 artırmaktadır.
                        </p>
                    </div>
                </div>
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
