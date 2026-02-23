"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MotionCard } from "@/components/ui/motion-card"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ConsultantData {
    name: string
    score: number
    strategic_insights: {
        market_position: string
        competitive_edge: string
        investment_priority: string
    }
    growth_ideas: string[]
    growth_hacks: string[]
    business_types: string[]
}

function ConsultantContent() {
    const searchParams = useSearchParams()
    const businessId = searchParams.get("id")
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ConsultantData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            if (!businessId) return
            try {
                // Fetch list of businesses to find this one and its place_id
                const response = await api.get("/businesses")
                const biz = response.data.find((b: any) => b.id.toString() === businessId)

                if (biz) {
                    const analysisRes = await api.get(`/businesses/analyze?place_id=${biz.google_place_id}`)
                    setData({
                        name: biz.name,
                        score: analysisRes.data.score,
                        strategic_insights: analysisRes.data.strategic_insights,
                        growth_ideas: analysisRes.data.growth_ideas,
                        growth_hacks: analysisRes.data.growth_hacks,
                        business_types: analysisRes.data.business_types || []
                    })
                } else {
                    setError("İşletme bulunamadı.")
                }
            } catch (err) {
                setError("Veriler alınırken bir hata oluştu.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [businessId])

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center flex-col gap-4 bg-slate-50 dark:bg-slate-900 transition-colors">
            <Icons.bot className="h-12 w-12 animate-bounce text-indigo-600" />
            <p className="font-bold text-indigo-900 dark:text-indigo-400 animate-pulse text-xl">Strateji Odası Hazırlanıyor...</p>
        </div>
    )

    if (error || !data) return (
        <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
            <Icons.warning className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-900 mb-2">Eyvah!</h3>
            <p className="text-red-700">{error || "Veri bulunamadı."}</p>
        </div>
    )

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-white">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Icons.bot className="h-64 w-64 rotate-12" />
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30 text-xs px-4 py-1.5 uppercase tracking-widest font-bold backdrop-blur-md">
                            PREMIUM DANIŞMANLIK MODU
                        </Badge>
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                        {data.name} İçin <br />
                        <span className="text-indigo-400 italic">Pazar Domine Etme</span> Planı
                    </h1>
                    <p className="text-indigo-200 text-lg md:text-xl max-w-2xl font-medium leading-relaxed opacity-90">
                        MapRank yapay zekası, sektörünüzdeki 1000'den fazla veriyi işledi.
                        İşte holdingleşme yolundaki stratejik yol haritanız.
                    </p>
                </div>
            </div>

            {/* Strategy Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* 1. Market Positioning Card */}
                <MotionCard className="lg:col-span-1 border-none shadow-xl bg-white dark:bg-slate-900 p-8 flex flex-col justify-between">
                    <div>
                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 shadow-inner">
                            <Icons.trophy className="h-8 w-8" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 dark:text-white">Pazar Konumlandırması</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">Analizlere göre pazarın şu anki konumunuz:</p>

                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">Mevcut Durum</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{data.strategic_insights.market_position}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Rekabet Avantajınız</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{data.strategic_insights.competitive_edge}</p>
                            </div>
                            <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <p className="text-[10px] font-black uppercase mb-1 opacity-70">Acil Yatırım Önceliği</p>
                                <p className="text-lg font-bold">{data.strategic_insights.investment_priority}</p>
                            </div>
                        </div>
                    </div>
                </MotionCard>

                {/* 2. Industry-Specific Innovation Card */}
                <MotionCard delay={0.2} className="lg:col-span-2 border-none shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-3xl font-black flex items-center gap-4 dark:text-white">
                            <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Icons.settings className="h-7 w-7 animate-spin-slow" />
                            </div>
                            Sektörel İnovasyon Fikirleri
                        </h3>
                    </div>
                    <div className="p-8 md:p-10 grid gap-6 md:grid-cols-2">
                        {data.growth_ideas?.map((idea, i) => (
                            <div key={i} className="group p-6 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {i + 1}
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-200 font-bold leading-snug">{idea}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </MotionCard>
            </div>

            {/* Full Growth Roadmap */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* 3. Tactical Growth Hacks */}
                <MotionCard className="border-none shadow-xl bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-[2rem]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-3xl font-black dark:text-white">Growth Hacking Motoru</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Bu küçük hamleler büyük sonuçlar yaratır.</p>
                        </div>
                        <Icons.activity className="h-10 w-10 text-indigo-600 opacity-20" />
                    </div>
                    <div className="space-y-4">
                        {data.growth_hacks?.map((hack, i) => (
                            <div key={i} className="flex gap-5 p-4 items-center border-b border-slate-50 dark:border-slate-800 group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                                <div className="h-2 w-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                                <p className="text-slate-700 dark:text-slate-300 font-semibold">{hack}</p>
                            </div>
                        ))}
                    </div>
                </MotionCard>

                {/* 4. Scaling Plan (Holding/Factory vision) */}
                <MotionCard delay={0.3} className="border-none shadow-xl bg-slate-900 text-white p-8 md:p-12 rounded-[2rem] relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-600 opacity-10 pointer-events-none" />
                    <div className="relative z-10 space-y-8">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black">Ölçekleme ve Kurumsallık</h3>
                            <p className="text-indigo-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Fabrika ve Holding Vizyonu Yol Haritası</p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-6">
                                <div className="h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                                    <Icons.activity className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg">Dijital Standartizasyon</p>
                                    <p className="text-xs text-indigo-200/60">Tüm şubeler ve birimler için tekil dijital kimlik protokolü.</p>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-6">
                                <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Icons.globe className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg">Global Otorite Kurulumu</p>
                                    <p className="text-xs text-indigo-200/60">Uluslararası pazar analizi ve çok dilli görünürlük optimizasyonu.</p>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-6">
                                <div className="h-12 w-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                    <Icons.store className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg">Veri Odaklı Karar Mekanizması</p>
                                    <p className="text-xs text-indigo-200/60">Yapay zeka tahminleriyle lokasyon ve stok yönetimi.</p>
                                </div>
                            </div>
                        </div>

                        <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold py-6 rounded-2xl text-lg group">
                            Holdingleşme Raporunu İndir
                            <Icons.arrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                        </Button>
                    </div>
                </MotionCard>
            </div>
        </div>
    )
}

export default function ConsultantPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[80vh] items-center justify-center">
                <Icons.spinner className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        }>
            <ConsultantContent />
        </Suspense>
    )
}
