"use client"

import { useEffect, useState } from "react"
import type { ChangeEvent } from "react"
import { motion } from "framer-motion"
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Wand2, Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { Icons } from "@/components/icons"
import { MotionCard } from "@/components/ui/motion-card"

interface Review {
    author_name: string
    rating: number
    text: string
    relative_time_description: string
    time: number
    profile_photo_url?: string
    sentiment: "positive" | "negative" | "neutral"
}

interface Business {
    id: string
    name: string
    google_place_id: string
}

export default function ReviewsPage() {
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    // Reply Draft State
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)
    const [draftTone, setDraftTone] = useState("professional")
    const [generatedDraft, setGeneratedDraft] = useState("")
    const [generating, setGenerating] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetchBusinesses()
    }, [])

    useEffect(() => {
        if (selectedBusinessId) {
            const business = businesses.find(b => b.id === selectedBusinessId)
            if (business) {
                fetchReviews(business.google_place_id)
            }
        }
    }, [selectedBusinessId])

    const fetchBusinesses = async () => {
        try {
            const res = await api.get("/businesses")
            setBusinesses(res.data)
            if (res.data.length > 0) {
                setSelectedBusinessId(res.data[0].id)
            }
        } catch (error) {
            console.error("Failed to fetch businesses", error)
        }
    }

    const fetchReviews = async (placeId: string) => {
        setLoading(true)
        try {
            const res = await api.get(`/reviews?place_id=${placeId}`)
            setReviews(res.data)
        } catch (error) {
            toast({
                title: "Hata",
                description: "Yorumlar getirilemedi.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateDraft = async () => {
        if (!selectedReview) return
        setGenerating(true)
        try {
            const res = await api.post("/reviews/draft", {
                review_text: selectedReview.text,
                rating: selectedReview.rating,
                author_name: selectedReview.author_name,
                tone: draftTone
            })
            setGeneratedDraft(res.data.draft)
        } catch (error) {
            toast({
                title: "Hata",
                description: "Taslak oluşturulamadı.",
                variant: "destructive",
            })
        } finally {
            setGenerating(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedDraft)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({
            title: "Kopyalandı",
            description: "Yanıt taslağı panoya kopyalandı.",
        })
    }

    const openReplyModal = (review: Review) => {
        setSelectedReview(review)
        setGeneratedDraft("")
        setDraftTone("professional")
        setModalOpen(true)
    }

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case "positive": return "bg-green-100 text-green-800"
            case "negative": return "bg-red-100 text-red-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getSentimentLabel = (sentiment: string) => {
        switch (sentiment) {
            case "positive": return "Olumlu"
            case "negative": return "Olumsuz"
            default: return "Nötr"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Yorum Yönetimi</h2>
                    <p className="text-muted-foreground">
                        Müşteri yorumlarını takip edin ve yapay zeka ile yanıtlayın.
                    </p>
                </div>
                <div className="w-[300px]">
                    <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                        <SelectTrigger>
                            <SelectValue placeholder="İşletme Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {businesses.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {businesses.length === 0 && !loading && (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        Henüz takip edilen işletme bulunmuyor. Lütfen önce işletme ekleyin.
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-1">
                    {reviews.map((review, index) => (
                        <MotionCard key={index} delay={index * 0.1}>
                            <CardContent className="p-6">
                                <div className="flex gap-4">
                                    <div className="flex-none">
                                        <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                            {review.profile_photo_url ? (
                                                <img src={review.profile_photo_url} alt={review.author_name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-slate-500">{review.author_name.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold">{review.author_name}</h4>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <span>{review.relative_time_description}</span>
                                                    <span>•</span>
                                                    <div className="flex text-yellow-500">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-current" : "text-gray-300"}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className={getSentimentColor(review.sentiment)}>
                                                {getSentimentLabel(review.sentiment)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {review.text}
                                        </p>
                                        <div className="pt-2">
                                            <Button variant="outline" size="sm" onClick={() => openReplyModal(review)}>
                                                <Wand2 className="mr-2 h-3 w-3" />
                                                AI Yanıtı Oluştur
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </MotionCard>
                    ))}
                    {reviews.length === 0 && !loading && businesses.length > 0 && (
                        <div className="text-center text-muted-foreground p-12">
                            Bu işletme için görüntülenecek yorum bulunamadı.
                        </div>
                    )}
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Yapay Zeka Yanıt Asistanı</DialogTitle>
                        <DialogDescription>
                            Müşteri yorumuna uygun, profesyonel bir yanıt taslağı oluşturun.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReview && (
                        <div className="grid gap-4 py-4">
                            <div className="bg-muted p-4 rounded-md text-sm italic">
                                "{selectedReview.text}"
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium col-span-1">
                                    Yanıt Tonu
                                </label>
                                <Select value={draftTone} onValueChange={setDraftTone}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Profesyonel & Kurumsal</SelectItem>
                                        <SelectItem value="friendly">Samimi & Sıcak</SelectItem>
                                        <SelectItem value="apologetic">Özür Dileyici & Çözüm Odaklı</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                                <label className="text-right text-sm font-medium col-span-1 pt-2">
                                    Taslak
                                </label>
                                <div className="col-span-3 space-y-2">
                                    <Textarea
                                        className="min-h-[150px]"
                                        value={generatedDraft}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setGeneratedDraft(e.target.value)}
                                        placeholder="Taslak oluşturmak için butona tıklayın..."
                                    />
                                    <div className="flex justify-between">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleGenerateDraft}
                                            disabled={generating}
                                        >
                                            {generating ? <Icons.spinner className="mr-2 h-3 w-3 animate-spin" /> : <Wand2 className="mr-2 h-3 w-3" />}
                                            {generatedDraft ? "Yeniden Oluştur" : "Taslak Oluştur"}
                                        </Button>

                                        {generatedDraft && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={copyToClipboard}
                                            >
                                                {copied ? <Check className="mr-2 h-3 w-3 text-green-600" /> : <Copy className="mr-2 h-3 w-3" />}
                                                Kopyala
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Kapat</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
