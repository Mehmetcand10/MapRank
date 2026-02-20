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
            <div className="flex h-[50vh] items-center justify-center">
                <Icons.spinner className="h-8 w-8 animate-spin" />
                <span className="ml-2">İşletme verileri ve rakipler analiz ediliyor...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col h-[50vh] items-center justify-center space-y-4">
                <div className="text-red-500 font-medium text-lg">Analiz Yüklenemedi</div>
                <div className="text-muted-foreground">{error}</div>
                <Button variant="outline" onClick={() => router.back()}>Geri Dön ve Tekrar Dene</Button>
            </div>
        )
    }

    if (!data) {
        return <div>Veri bulunamadı.</div>
    }

    // Helper to get initials from name
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
    }

    // Helper to format business type
    const formatType = (type: string) => {
        return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    }

    return (
        <div className="space-y-8 p-4 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{name || "İşletme Analizi"}</h2>
                        {data.validation_status !== "Unknown" && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100/80">
                                <Icons.check className="mr-1 h-3 w-3" />
                                Onaylı İşletme
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground max-w-2xl text-lg">{data.formatted_address}</p>
                    {data.business_types && data.business_types.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {data.business_types.slice(0, 3).map((type, i) => (
                                <Badge key={i} variant="outline" className="text-muted-foreground">
                                    {formatType(type)}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="lg" onClick={() => router.back()}>
                        <Icons.chevronLeft className="mr-2 h-4 w-4" />
                        Geri Dön
                    </Button>
                    {data.website && (
                        <Button variant="outline" size="lg" onClick={() => window.open(data.website, '_blank')}>
                            <Icons.globe className="mr-2 h-4 w-4" />
                            Web Sitesi
                        </Button>
                    )}

                    {data.is_tracked ? (
                        <Button variant="secondary" size="lg" onClick={() => router.push("/dashboard")}>
                            <Icons.check className="mr-2 h-4 w-4" />
                            Takip Ediliyor
                        </Button>
                    ) : (
                        <Button size="lg" onClick={handleSaveBusiness} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : <Icons.plus className="mr-2 h-4 w-4" />}
                            Sisteme Kaydet & Takip Et
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

                {/* 1. MapRank Score Card (Large) */}
                <MotionCard delay={0.1} className="col-span-3 row-span-2 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Icons.activity className="w-48 h-48" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-2xl">MapRank Skoru</CardTitle>
                        <CardDescription>İşletmenizin genel dijital sağlık puanı.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center flex-1 pb-10">
                        <div className="relative flex items-center justify-center mb-6">
                            <svg className="h-48 w-48 transform -rotate-90">
                                <circle
                                    className="text-muted/20"
                                    strokeWidth="12"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="80"
                                    cx="96"
                                    cy="96"
                                />
                                <circle
                                    className={`${data.score >= 80 ? "text-green-500" : data.score >= 60 ? "text-yellow-500" : "text-red-500"} transition-all duration-1000 ease-out`}
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
                                <span className="text-5xl font-bold tracking-tighter">{data.score}</span>
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
                                    {data.score >= 80 ? "Mükemmel" : data.score >= 60 ? "İyi" : "Kritik"}
                                </span>
                            </div>
                        </div>
                        <p className="text-center text-muted-foreground px-6 leading-relaxed">
                            {data.analysis_text}
                        </p>
                    </CardContent>
                </MotionCard>

                {/* 2. Key Metrics Cards */}
                <div className="col-span-4 grid gap-6 md:grid-cols-2">
                    <MotionCard delay={0.2} className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Icons.trophy className="w-24 h-24" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">Sıralama Konumu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">#{data.metrics.rank_position || "-"}</span>
                                <span className="text-sm text-muted-foreground">
                                    / {data.metrics.total_competitors ? `${data.metrics.total_competitors} Rakip` : "N/A"}
                                </span>
                            </div>
                            <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${Math.max(5, 100 - ((data.metrics.rank_position || 1) / (data.metrics.total_competitors || 1) * 100))}%` }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">Bölgedeki rakiplerinize göre konumunuz.</p>
                        </CardContent>
                    </MotionCard>

                    <MotionCard delay={0.3} className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Icons.star className="w-24 h-24" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">Sektör Ortalaması</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">{data.metrics.avg_competitor_rating || "-"}</span>
                                <span className="text-sm text-muted-foreground text-yellow-500">
                                    <Icons.star className="inline w-3 h-3 mb-1 mr-1 fill-current" />
                                    Puan
                                </span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs">
                                <span className="font-medium">Sizin Puanınız:</span>
                                <Badge variant={data.metrics.rating >= (data.metrics.avg_competitor_rating || 0) ? "default" : "destructive"}>
                                    {data.metrics.rating}
                                </Badge>
                            </div>
                        </CardContent>
                    </MotionCard>
                </div>

                {/* 3. Detailed Metrics Progress */}
                <MotionCard delay={0.4} className="col-span-4">
                    <CardHeader>
                        <CardTitle>Performans Metrikleri</CardTitle>
                        <CardDescription>Hedeflerinize göre mevcut durumunuz.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Rating Metric */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                                        <Icons.star className="w-4 h-4 fill-current" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium">Ortalama Puan</span>
                                        <span className="text-xs text-muted-foreground">Müşteri memnuniyeti</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold">{data.metrics.rating}</span>
                                    <span className="text-sm text-muted-foreground"> / 5.0</span>
                                </div>
                            </div>
                            <Progress value={(data.metrics.rating / 5) * 100} className="h-3" />
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                <span>Riskli: 0.0</span>
                                <span>Hedef: {data.targets.rating}</span>
                            </div>
                        </div>

                        {/* Review Count Metric */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                        <Icons.user className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium">Toplam Yorum</span>
                                        <span className="text-xs text-muted-foreground">Güvenilirlik işareti</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold">{data.metrics.review_count}</span>
                                    <span className="text-sm text-muted-foreground"> Adet</span>
                                </div>
                            </div>
                            <Progress value={Math.min((data.metrics.review_count / data.targets.review_count) * 100, 100)} className="h-3" />
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                <span>Başlangıç</span>
                                <span>Hedef: {data.targets.review_count}</span>
                            </div>
                        </div>
                    </CardContent>
                </MotionCard>
            </div>

            {/* Competitors & AI Analysis Section */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Competitors List */}
                <MotionCard delay={0.5} className="col-span-1 border-blue-100 dark:border-blue-900 border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Icons.mapPin className="w-5 h-5 text-blue-500" />
                            Yakındaki Rakipler
                        </CardTitle>
                        <CardDescription>Bölgenizdeki en güçlü rakiplerin analizi.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.competitors?.map((comp, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0 font-bold text-muted-foreground w-4 text-center">
                                            {i + 1}
                                        </div>
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                                                {getInitials(comp.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-0.5 overflow-hidden">
                                            <p className="font-medium text-sm truncate max-w-[140px] leading-tight" title={comp.name}>
                                                {comp.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                                                {comp.address}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-sm font-bold">
                                                <span>{comp.rating}</span>
                                                <Icons.star className="w-3 h-3 text-yellow-500 fill-current" />
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <span>{comp.user_ratings_total}</span>
                                                <Icons.user className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!data.competitors || data.competitors.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-lg border border-dashed">
                                    <Icons.search className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
                                    <p className="text-sm font-medium text-muted-foreground">Bu kategoride yakın rakip bulunamadı.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </MotionCard>

                {/* AI Sentiment Analysis */}
                <div className="space-y-6">
                    <MotionCard delay={0.6} className="border-purple-100 dark:border-purple-900 border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Icons.bot className="w-5 h-5 text-purple-500" />
                                Yapay Zeka Yorum Analizi
                            </CardTitle>
                            <CardDescription>Müşteri yorumlarının duygu durumu dağılımı.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm items-end">
                                    <span className="font-medium text-green-600 flex items-center gap-1">
                                        <Icons.smile className="w-4 h-4" />
                                        Olumlu
                                    </span>
                                    <span className="font-bold">{data.metrics.sentiment_positive || 0}%</span>
                                </div>
                                <Progress value={data.metrics.sentiment_positive || 0} className="h-2.5 bg-green-100" indicatorClassName="bg-green-600" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm items-end">
                                    <span className="font-medium text-gray-600 flex items-center gap-1">
                                        <Icons.minus className="w-4 h-4" />
                                        Nötr
                                    </span>
                                    <span className="font-bold">{data.metrics.sentiment_neutral || 0}%</span>
                                </div>
                                <Progress value={data.metrics.sentiment_neutral || 0} className="h-2.5 bg-gray-100" indicatorClassName="bg-gray-500" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm items-end">
                                    <span className="font-medium text-red-600 flex items-center gap-1">
                                        <Icons.skull className="w-4 h-4" />
                                        Olumsuz
                                    </span>
                                    <span className="font-bold">{data.metrics.sentiment_negative || 0}%</span>
                                </div>
                                <Progress value={data.metrics.sentiment_negative || 0} className="h-2.5 bg-red-100" indicatorClassName="bg-red-600" />
                            </div>
                        </CardContent>
                    </MotionCard>

                    <MotionCard delay={0.7} className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Eylem Planı</CardTitle>
                            <CardDescription>Sıralamanızı yükseltmek için öneriler.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {data.recommendations.map((rec, index) => (
                                    <div key={index} className="flex gap-3 items-start bg-background p-3 rounded-md shadow-sm border">
                                        <div className="mt-0.5 shrink-0">
                                            {rec.type === 'critical' ? (
                                                <Icons.warning className="h-5 w-5 text-red-500" />
                                            ) : rec.type === 'warning' ? (
                                                <Icons.alertCircle className="h-5 w-5 text-yellow-500" />
                                            ) : (
                                                <Icons.checkCircle className="h-5 w-5 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className={`text-sm font-semibold ${rec.type === 'critical' ? 'text-red-600' : rec.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                                                }`}>
                                                {rec.type === 'critical' ? 'Kritik İyileştirme' : rec.type === 'warning' ? 'Dikkat Gerekiyor' : 'Öneri'}
                                            </p>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {rec.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {data.recommendations.length === 0 && (
                                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-md">
                                        <Icons.checkCircle className="h-5 w-5" />
                                        <span className="font-medium">Her şey harika görünüyor! Şu an için ek bir önerimiz yok.</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </MotionCard>
                </div>
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
