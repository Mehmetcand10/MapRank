"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Map as MapIcon,
    Search,
    Settings,
    RefreshCcw,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    LocateFixed,
    Maximize2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function GridRankPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState("")
    const [radius, setRadius] = useState("1")
    const [gridSize, setGridSize] = useState("5")
    const [snapshot, setSnapshot] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [businessId, setBusinessId] = useState<string | null>(null)

    useEffect(() => {
        // Find business ID from local storage or context (mocked for now)
        const storedBusinessId = localStorage.getItem('last_business_id')
        if (storedBusinessId) setBusinessId(storedBusinessId)
        else fetchBusinessId()
    }, [])

    const fetchBusinessId = async () => {
        try {
            const res = await api.get('/businesses')
            if (res.data && res.data.length > 0) {
                const id = res.data[0].id
                setBusinessId(id)
                localStorage.setItem('last_business_id', id)
                fetchHistory(id)
            }
        } catch (error) {
            console.error("Error fetching business:", error)
        }
    }

    const fetchHistory = async (id: string) => {
        try {
            const res = await api.get(`/grid/${id}/history`)
            setHistory(res.data)
            if (res.data.length > 0) setSnapshot(res.data[0])
        } catch (error) {
            console.error("Error fetching grid history:", error)
        }
    }

    const startAnalysis = async () => {
        if (!keyword) {
            toast({ title: "Keyword is required", variant: "destructive" })
            return
        }
        if (!businessId) return

        setLoading(true)
        try {
            const res = await api.post(`/grid/${businessId}/analyze`, null, {
                params: {
                    keyword,
                    radius_km: parseFloat(radius),
                    grid_size: parseInt(gridSize)
                }
            })
            setSnapshot(res.data)
            fetchHistory(businessId)
            toast({ title: "Analysis complete", description: `Visibility Score: ${res.data.visibility_score}%` })
        } catch (error: any) {
            toast({
                title: "Analysis failed",
                description: error.response?.data?.detail || "An unexpected error occurred",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">Grid Ranking Heatmap</h1>
                    <p className="text-muted-foreground mt-1">Görünürlüğünüzü mahalle ve sokak bazlı analiz edin.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="hidden md:flex">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Karşılaştır
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => businessId && fetchHistory(businessId)}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Yenile
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sol Panel: Kontroller */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <Card className="border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Settings className="mr-2 h-4 w-4 text-blue-500" />
                                Analiz Yapılandırması
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="keyword">Hedef Anahtar Kelime</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="keyword"
                                        placeholder="Örn: En yakın tesisatçı..."
                                        className="pl-9"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Yarıçap (km)</Label>
                                    <Select value={radius} onValueChange={setRadius}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 km</SelectItem>
                                            <SelectItem value="2">2 km</SelectItem>
                                            <SelectItem value="3">3 km</SelectItem>
                                            <SelectItem value="5">5 km</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Grid Boyutu</Label>
                                    <Select value={gridSize} onValueChange={setGridSize}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3">3x3 (Hızlı)</SelectItem>
                                            <SelectItem value="5">5x5 (Dengeli)</SelectItem>
                                            <SelectItem value="7">7x7 (Detaylı)</SelectItem>
                                            <SelectItem value="9">9x9 (Premium)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
                                onClick={startAnalysis}
                                disabled={loading}
                            >
                                {loading ? (
                                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <MapIcon className="mr-2 h-4 w-4" />
                                )}
                                Analizi Başlat
                            </Button>
                        </CardContent>
                    </Card>

                    {/* AI Özet Paneli */}
                    <AnimatePresence>
                        {snapshot && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="border-indigo-500/20 bg-indigo-500/5">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center text-indigo-400">
                                            <TrendingUp className="mr-2 h-4 w-4" />
                                            Görünürlük Analizi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{snapshot.visibility_score}%</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Bu kelimede genel kapsam puanınız.
                                        </p>
                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span>Ort. Sıralama</span>
                                                <span className="font-semibold">{snapshot.average_rank?.toFixed(1)}</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5">
                                                <div
                                                    className="bg-indigo-500 h-1.5 rounded-full"
                                                    style={{ width: `${snapshot.visibility_score}%` }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sağ Panel: Harita ve Detaylar */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <Card className="min-h-[500px] flex flex-col overflow-hidden border-none shadow-2xl bg-slate-950/40 relative">
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <Button size="icon" variant="secondary" className="bg-slate-900/80 backdrop-blur-md">
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 min-h-[400px] bg-slate-900/50 flex items-center justify-center p-8 relative overflow-hidden">
                            {/* Placeholder for real map initialization */}
                            {snapshot ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Mock Grid Visualization */}
                                    <div
                                        className="grid gap-4"
                                        style={{
                                            gridTemplateColumns: `repeat(${snapshot.grid_size}, 1fr)`,
                                            width: '80%',
                                            maxWidth: '500px'
                                        }}
                                    >
                                        {snapshot.points.map((p: any, idx: number) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className={`
                                                    aspect-square rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg
                                                    ${p.rank === 1 ? 'bg-green-500 shadow-green-500/50' :
                                                        p.rank <= 3 ? 'bg-green-400/80' :
                                                            p.rank <= 10 ? 'bg-yellow-500/80 shadow-yellow-500/30' :
                                                                'bg-red-500/80 shadow-red-500/30'}
                                                    text-white
                                                `}
                                            >
                                                {p.rank || ">20"}
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 pointer-events-none border border-slate-700/50 rounded-lg group-hover:border-blue-500/20 transition-colors" />
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto ring-4 ring-blue-500/10 animate-pulse">
                                        <MapIcon className="h-8 w-8 text-blue-500/40" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        Analizi başlatmak için bir anahtar kelime girin.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* AI Önerileri Alt Panel */}
                    <Tabs defaultValue="suggestions" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
                            <TabsTrigger value="suggestions">AI Büyüme Önerileri</TabsTrigger>
                            <TabsTrigger value="competitors">Rekabet Analizi</TabsTrigger>
                        </TabsList>
                        <TabsContent value="suggestions" className="mt-4">
                            <Card className="bg-slate-900/20 border-slate-800">
                                <CardContent className="p-6">
                                    {snapshot ? (
                                        <div className="space-y-4">
                                            <div className="flex gap-4 p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                                                <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
                                                <div>
                                                    <h4 className="font-semibold text-red-400">Görünürlük Boşluğu Tespit Edildi</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Kuzey-Doğu bölgesinde rakipleriniz "{snapshot.keyword}" kelimesinde daha baskın. GMB profilinize bu bölgeden çekilmiş taze fotoğraflar eklemeniz önerilir.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                                                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                                                <div>
                                                    <h4 className="font-semibold text-green-400">Yerel Hakimiyet</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Merkez bölgede 1. sıradasınız. Bu konumu korumak için yorum cevaplama sürenizi 24 saatin altında tutun.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8 italic">
                                            Analiz sonuçları açıklandığında burada AI önerileri göreceksiniz.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="competitors">
                            <Card className="bg-slate-900/20 border-slate-800">
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-900/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Rakip İşletme</th>
                                                    <th className="px-4 py-3 text-left">Grid Kazanma Oranı</th>
                                                    <th className="px-4 py-3 text-left">Görünürlük</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {history.slice(0, 3).map((h, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-3 font-medium">Local Competitor #{i + 1}</td>
                                                        <td className="px-4 py-3">%{Math.floor(Math.random() * 40 + 10)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[100px]">
                                                                <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '45%' }} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
