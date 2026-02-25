"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MotionCard } from "@/components/ui/motion-card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface Keyword {
    id: string
    term: string
    location: string
}

interface Ranking {
    snapshot_date: string
    score: number
    rank_position: number
}

interface SEOAudit {
    overall_score: number
    audit_data: any
    ai_recommendations: Array<{
        priority: string
        category: string
        title: string
        description: string
        est_impact: string
    }>
}

function SEOContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const businessId = searchParams.get("id")
    const [keywords, setKeywords] = useState<Keyword[]>([])
    const [history, setHistory] = useState<Ranking[]>([])
    const [loading, setLoading] = useState(true)
    const [businessName, setBusinessName] = useState("")
    const [newKeyword, setNewKeyword] = useState("")
    const [location, setLocation] = useState("Mamak, Ankara")

    // AI States
    const [audit, setAudit] = useState<SEOAudit | null>(null)
    const [auditLoading, setAuditLoading] = useState(false)
    const [description, setDescription] = useState("")
    const [descLoading, setDescLoading] = useState(false)
    const [prediction, setPrediction] = useState<any>(null)
    const [predictLoading, setPredictLoading] = useState(false)
    const [selectedPredictKw, setSelectedPredictKw] = useState("")

    useEffect(() => {
        if (!businessId) {
            router.push("/dashboard")
            return
        }

        const fetchData = async () => {
            try {
                const bizRes = await api.get("/businesses")
                const biz = bizRes.data.find((b: any) => b.id.toString() === businessId)
                if (!biz) return
                setBusinessName(biz.name)

                const [kwRes, histRes] = await Promise.all([
                    api.get(`/businesses/${businessId}/keywords`),
                    api.get(`/businesses/${businessId}/rankings/history`)
                ])
                setKeywords(kwRes.data)
                setHistory(histRes.data)
            } catch (err) {
                console.error("SEO fetch failed", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [businessId])

    const handleAddKeyword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newKeyword.trim()) return
        try {
            const res = await api.post(`/businesses/${businessId}/keywords`, {
                term: newKeyword,
                location: location
            })
            setKeywords([...keywords, res.data])
            setNewKeyword("")
            toast({ title: "Başarılı", description: "Anahtar kelime takibe alındı." })
        } catch (err) {
            toast({ title: "Hata", description: "Kelime eklenemedi.", variant: "destructive" })
        }
    }

    const handleDeleteKeyword = async (id: string) => {
        try {
            await api.delete(`/businesses/${businessId}/keywords/${id}`)
            setKeywords(keywords.filter(k => k.id !== id))
            toast({ title: "Silindi", description: "Kelime takibi durduruldu." })
        } catch (err) {
            toast({ title: "Hata", description: "Kelime silinemedi.", variant: "destructive" })
        }
    }

    const handleRunAudit = async () => {
        setAuditLoading(true)
        try {
            const res = await api.post(`/ai/${businessId}/seo-audit`)
            setAudit(res.data)
            toast({ title: "Analiz Hazır", description: "Local SEO denetimi tamamlandı." })
        } catch (err) {
            toast({ title: "Analiz Başarısız", description: "Denetim motoru şu an meşgul.", variant: "destructive" })
        } finally {
            setAuditLoading(false)
        }
    }

    const handleGenerateDescription = async () => {
        setDescLoading(true)
        try {
            const res = await api.post("/ai/generate-description", {
                category: "Local Business",
                location: location,
                keywords: keywords.map(k => k.term),
                tone: "professional"
            })
            setDescription(res.data.description)
            toast({ title: "Açıklama Yazıldı", description: "Yapay zeka profil açıklamanızı hazırladı." })
        } catch (err) {
            toast({ title: "Hata", description: "Açıklama oluşturulamadı.", variant: "destructive" })
        } finally {
            setDescLoading(false)
        }
    }

    const handlePredict = async () => {
        if (!selectedPredictKw) {
            toast({ title: "Uyarı", description: "Simülasyon için bir kelime seçmelisiniz." })
            return
        }
        setPredictLoading(true)
        try {
            const res = await api.post(`/ai/${businessId}/predict`, {
                keyword: selectedPredictKw,
                scenario: {
                    new_photos: 10,
                    new_reviews: 5,
                    optimized_description: true
                }
            })
            setPrediction(res.data)
        } catch (err) {
            toast({ title: "Hata", description: "Simülasyon motoru yanıt vermedi.", variant: "destructive" })
        } finally {
            setPredictLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <Icons.spinner className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">SEO Verileri İşleniyor...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => router.back()} className="rounded-full -ml-2 text-slate-500 p-2">
                            <Icons.chevronLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Lokal SEO Takip Merkezi</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">{businessName} için kelime bazlı görünürlük analizi.</p>
                </div>
                <Badge className="bg-indigo-600 text-white border-none py-2 px-4 rounded-xl shadow-lg">LOKAL SEO PRO</Badge>
            </div>

            <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-12">
                {/* Ranking History Chart */}
                <MotionCard className="lg:col-span-8 border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Icons.activity className="h-4 w-4 text-indigo-600" />
                            Genel Görünürlük Trendi
                        </CardTitle>
                        <CardDescription>Son 30 günlük MapRank skor değişimi.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="snapshot_date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </MotionCard>

                {/* Keyword Management Side */}
                <div className="lg:col-span-4 space-y-6">
                    <MotionCard className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem]">
                        <CardHeader className="p-8">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-400">Yeni Kelime Takibi</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-4">
                            <form onSubmit={handleAddKeyword} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Anahtar Kelime</label>
                                    <Input
                                        value={newKeyword}
                                        onChange={(e) => setNewKeyword(e.target.value)}
                                        placeholder="Örn: En iyi pizza"
                                        className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Hedef Lokasyon</label>
                                    <Input
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold uppercase text-xs">
                                    Takibi Başlat
                                </Button>
                            </form>
                        </CardContent>
                    </MotionCard>

                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Takipteki Kelimeler ({keywords.length})</h3>
                        {keywords.map((kw) => (
                            <div key={kw.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{kw.term}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{kw.location}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleDeleteKeyword(kw.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 p-2 hover:bg-red-50 rounded-xl"
                                >
                                    <Icons.minus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* AI SEO Audit Tool */}
                    <MotionCard className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Icons.checkCircle className="h-4 w-4 text-emerald-500" />
                                AI SEO Denetimi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-4">
                            {!audit ? (
                                <div className="text-center space-y-4">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 text-left">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Nasıl Çalışır?</p>
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed">Profilinizin Google Maps sıralama faktörlerine uyumunu saniyeler içinde analiz eder.</p>
                                    </div>
                                    <Button onClick={handleRunAudit} disabled={auditLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 font-bold uppercase text-xs">
                                        {auditLoading ? <Icons.spinner className="h-4 w-4 animate-spin mr-2" /> : <Icons.activity className="h-4 w-4 mr-2" />}
                                        Analizi Başlat
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase">Sağlık Skoru</span>
                                        <span className="text-2xl font-black text-emerald-600">%{audit.overall_score ?? 0}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">Kritik Öneriler</p>
                                        <div className="space-y-2">
                                            {(audit.ai_recommendations || []).slice(0, 3).map((rec: any, i: number) => (
                                                <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-black text-indigo-600 uppercase text-[9px]">{rec.category}</span>
                                                        <Badge className="text-[8px] bg-indigo-50 text-indigo-600 border-none">{rec.priority}</Badge>
                                                    </div>
                                                    <p className="font-bold mb-1">{rec.title}</p>
                                                    <p className="text-[10px] opacity-70 italic">{rec.description}</p>
                                                    <div className="mt-2 pt-2 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                                                        <span className="text-[9px] font-bold text-emerald-600">{rec.est_impact}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => setAudit(null)} className="w-full rounded-xl text-[10px] uppercase font-bold text-slate-400 border-slate-100 dark:border-slate-800">Yeniden Tara</Button>
                                </div>
                            )}
                        </CardContent>
                    </MotionCard>

                    {/* AI Description Generator */}
                    <MotionCard className="border-none shadow-xl bg-indigo-950 text-white rounded-[2.5rem] overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Icons.bot className="h-20 w-20" />
                        </div>
                        <CardHeader className="p-8">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400">AI Profil Yazarı</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-4">
                            {!description ? (
                                <div className="space-y-4">
                                    <p className="text-xs text-indigo-200/60 font-medium">Sıralama kazandıran, anahtar kelime odaklı bir açıklama üretin.</p>
                                    <Button onClick={handleGenerateDescription} disabled={descLoading} className="w-full bg-white text-indigo-950 hover:bg-white/90 rounded-2xl h-12 font-black uppercase text-xs shadow-lg shadow-indigo-950/20">
                                        {descLoading ? <Icons.spinner className="h-4 w-4 animate-spin mr-2" /> : <Icons.bot className="h-4 w-4 mr-2" />}
                                        Yapay Zeka Yazsın
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in duration-500">
                                    <textarea
                                        readOnly
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium leading-relaxed min-h-[140px] text-indigo-100 outline-none"
                                        value={description}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            onClick={() => {
                                                navigator.clipboard.writeText(description)
                                                toast({ title: "Kopyalandı", description: "Panoya kopyalandı." })
                                            }}
                                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl h-10 text-[10px] uppercase font-bold"
                                        >
                                            Kopyala
                                        </Button>
                                        <Button variant="ghost" onClick={() => setDescription("")} className="text-indigo-400 hover:text-white h-10 text-[10px] uppercase font-bold">Yeni Taslak</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </MotionCard>
                </div>
            </div>

            {/* AI Ranking Prediction Simulation */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                <MotionCard className="border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] overflow-hidden">
                    <div className="grid md:grid-cols-12">
                        <div className="md:col-span-4 p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 flex flex-col justify-center">
                            <Icons.trending className="h-12 w-12 text-white/50 mb-6" />
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight mb-4 text-white">Sıralama<br />Simülatörü</h2>
                            <p className="text-indigo-100/80 text-sm font-medium leading-relaxed">Aksiyonlarınızın gelecekteki etkisini görün.</p>
                        </div>
                        <div className="md:col-span-8 p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest pl-1">Hedef Kelime</label>
                                    <select
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-white/10 transition-all text-white"
                                        value={selectedPredictKw}
                                        onChange={(e) => setSelectedPredictKw(e.target.value)}
                                    >
                                        <option value="" className="bg-slate-900">Seçiniz...</option>
                                        {keywords.map(k => <option key={k.id} value={k.term} className="bg-slate-900">{k.term}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest pl-1">Aksiyon Paketi</label>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <Badge className="bg-white/10 text-white border-none py-2 px-4 rounded-xl text-[10px] font-bold">+10 Fotoğraf</Badge>
                                        <Badge className="bg-white/10 text-white border-none py-2 px-4 rounded-xl text-[10px] font-bold">+5 Yeni Yorum</Badge>
                                    </div>
                                </div>
                            </div>

                            {!prediction ? (
                                <Button
                                    onClick={handlePredict}
                                    disabled={predictLoading || !selectedPredictKw}
                                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white h-16 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-900/50 transition-all active:scale-95"
                                >
                                    {predictLoading ? <Icons.spinner className="h-5 w-5 animate-spin" /> : "Geleceği Simüle Et"}
                                </Button>
                            ) : (
                                <div className="animate-in slide-in-from-bottom-6 duration-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-8 bg-indigo-500/10 rounded-[2.5rem] border border-indigo-500/20 text-center space-y-1">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tahmin Edilen Skor</p>
                                            <p className="text-5xl font-black text-indigo-100 tracking-tighter">%{prediction.predicted_score}</p>
                                        </div>
                                        <div className="p-8 bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/20 text-center space-y-1">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Performans Artışı</p>
                                            <p className="text-5xl font-black text-emerald-100 tracking-tighter">+{prediction.improvement_factor}%</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-5">
                                            <Icons.activity className="h-12 w-12" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-300 leading-relaxed italic relative z-10">
                                            "Analiz: Seçtiğiniz aksiyonlar sıralamada pazar liderliğine %{prediction.improvement_factor} daha yaklaştırır."
                                        </p>
                                        <Button variant="link" onClick={() => setPrediction(null)} className="mt-4 p-0 h-auto text-[10px] font-black uppercase text-indigo-400 tracking-widest hover:text-white transition-colors">Senaryoyu Değiştir</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </MotionCard>
            </div>
        </div>
    )
}

export default function SEOPage() {
    return (
        <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><Icons.spinner className="h-8 w-8 animate-spin text-indigo-600" /></div>}>
            <SEOContent />
        </Suspense>
    )
}
