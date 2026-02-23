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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { cn } from "@/lib/utils"

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
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full -ml-2 text-slate-500">
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

                {/* Keyword Management */}
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
                                    size="sm"
                                    onClick={() => handleDeleteKeyword(kw.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Icons.minus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {keywords.length === 0 && (
                            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Henüz kelime eklenmedi.</p>
                            </div>
                        )}
                    </div>
                </div>
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
