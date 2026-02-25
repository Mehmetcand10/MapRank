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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Review {
    author_name: string
    rating: number
    text: string
    time_description: string
    profile_photo_url?: string
}

function ReviewsContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const businessId = searchParams.get("id")
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [businessName, setBusinessName] = useState("")
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)
    const [aiDraft, setAiDraft] = useState("")
    const [draftLoading, setDraftLoading] = useState(false)
    const [tone, setTone] = useState("professional")
    const [sentiments, setSentiments] = useState<Record<number, any>>({})

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

                const reviewsRes = await api.get(`/reviews?place_id=${biz.google_place_id}`)
                setReviews(reviewsRes.data)
            } catch (err) {
                console.error("Reviews fetch failed", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [businessId])

    const generateDraft = async (review: Review, index: number) => {
        setSelectedReview(review)
        setDraftLoading(true)
        setAiDraft("")
        try {
            const res = await api.post("/ai/generate-response", {
                review_text: review.text,
                rating: review.rating,
                author_name: review.author_name,
                tone: tone
            })
            setAiDraft(res.data.draft)

            if (!sentiments[index]) {
                const sentRes = await api.post(`/ai/analyze-sentiment?review_text=${encodeURIComponent(review.text)}`)
                setSentiments(prev => ({ ...prev, [index]: sentRes.data }))
            }
        } catch (err) {
            toast({
                title: "Hata",
                description: "Yapay zeka asistanı şu an yanıt veremiyor.",
                variant: "destructive"
            })
        } finally {
            setDraftLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!aiDraft) return
        navigator.clipboard.writeText(aiDraft)
        toast({
            title: "Kopyalandı!",
            description: "Yanıt taslağı panoya kopyalandı.",
        })
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <Icons.spinner className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">Müşteri Yorumları Yükleniyor...</p>
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
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Müşteri İlişkileri Merkezi</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">{businessName} için gelen tüm Google yorumları.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200" />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{reviews.length} Toplam Yorum</span>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-12">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Son Yorumlar</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Yazım Dili:</span>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger className="w-[140px] h-8 text-[10px] font-bold rounded-xl border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100">
                                    <SelectItem value="professional">Profesyonel</SelectItem>
                                    <SelectItem value="friendly">Samimi</SelectItem>
                                    <SelectItem value="apologetic">Özür Dileyen</SelectItem>
                                    <SelectItem value="marketing">Satış Odaklı</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-7 space-y-4">
                    {reviews.map((review, idx) => (
                        <MotionCard key={idx} className={cn(
                            "border-none shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white dark:bg-slate-900",
                            selectedReview === review && "ring-2 ring-indigo-600 shadow-xl"
                        )} onClick={() => generateDraft(review, idx)}>
                            <CardContent className="p-6">
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                        {review.profile_photo_url ? (
                                            <img src={review.profile_photo_url} alt={review.author_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Icons.user className="h-6 w-6 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{review.author_name}</h4>
                                            <span className="text-[10px] text-slate-400 font-bold">{review.time_description}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Icons.star key={i} className={cn("h-3 w-3", i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                            "{review.text || 'Metinsiz yorum'}"
                                        </p>
                                        {sentiments[idx] && (
                                            <div className="pt-2 flex items-center gap-2">
                                                <Badge className={cn(
                                                    "text-[9px] font-black uppercase border-none py-0.5 px-2 rounded-lg",
                                                    sentiments[idx].sentiment === 'positive' ? "bg-emerald-500/10 text-emerald-600" :
                                                        sentiments[idx].sentiment === 'negative' ? "bg-red-500/10 text-red-600" : "bg-slate-500/10 text-slate-500"
                                                )}>
                                                    {sentiments[idx].sentiment === 'positive' ? 'Pozitif Deneyim' :
                                                        sentiments[idx].sentiment === 'negative' ? 'Dikkat Edilmeli' : 'Nötr Geri Bildirim'}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </MotionCard>
                    ))}
                </div>

                {/* AI Interaction Side */}
                <div className="lg:col-span-5 relative">
                    <div className="sticky top-8 space-y-6">
                        <MotionCard className="border-none shadow-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white overflow-hidden rounded-[2.5rem]">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Icons.bot className="h-32 w-32 rotate-12" />
                            </div>
                            <CardHeader className="p-8">
                                <CardTitle className="text-white flex items-center gap-3 text-xl uppercase italic pb-2">
                                    <Icons.bot className="h-6 w-6 text-indigo-400" />
                                    AI Yanıt Asistanı
                                </CardTitle>
                                <CardDescription className="text-indigo-200/60 font-medium">Seçili yorum için en uygun, SEO dostu ve profesyonel yanıtı saniyeler içinde hazırlar.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-6">
                                {selectedReview ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Seçili Müşteri Mesajı</p>
                                            <p className="text-xs italic text-indigo-100/70 truncate">"{selectedReview.text}"</p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase">Yapay Zeka Taslağı</p>
                                                {draftLoading && (
                                                    <Icons.spinner className="h-3 w-3 animate-spin text-indigo-400" />
                                                )}
                                            </div>
                                            <Textarea
                                                value={aiDraft}
                                                onChange={(e) => setAiDraft(e.target.value)}
                                                placeholder="Bir yorum seçerek yanıt üretin..."
                                                className="min-h-[200px] bg-white text-slate-900 rounded-3xl p-5 font-medium leading-relaxed border-none focus-visible:ring-indigo-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <Button
                                                disabled={!aiDraft || draftLoading}
                                                onClick={copyToClipboard}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-950/50"
                                            >
                                                <Icons.checkCircle className="mr-2 h-4 w-4" />
                                                Yanıtı Kopyala
                                            </Button>
                                            <p className="text-center text-[10px] text-indigo-300/50 font-bold uppercase tracking-tight px-4">
                                                Yanıtı kopyalayıp Google My Business sayfanızda ilgili yoruma yapıştırın.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/10 rounded-[2rem]">
                                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                                            <Icons.search className="h-8 w-8 text-indigo-400 animate-bounce" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-indigo-200 uppercase text-xs">Yorum Seçilmedi</h4>
                                            <p className="text-[10px] text-indigo-300/50 max-w-[200px] mt-2">Yanıt üretmek için soldaki listeden bir müşteri yorumuna dokunun.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </MotionCard>

                        <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                            <h5 className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-[10px] uppercase mb-2">
                                <Icons.warning className="h-3 w-3" />
                                Neden Yanıtlamalıyım?
                            </h5>
                            <p className="text-[10px] text-amber-600 dark:text-amber-500/80 font-medium leading-relaxed">
                                Google'ın yerel arama algoritması, yorumlara hızlı ve detaylı yanıt veren işletmeleri "Alakalı ve Güvenilir" olarak işaretler ve haritalarda %40'a kadar daha üst sıralarda gösterir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ReviewsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[80vh] items-center justify-center">
                <Icons.spinner className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        }>
            <ReviewsContent />
        </Suspense>
    )
}
