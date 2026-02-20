"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MotionCard } from "@/components/ui/motion-card"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts"
import { motion } from "framer-motion"

interface Business {
    id: string
    name: string
    address: string
    total_rating: number
    review_count: number
    latest_ranking?: {
        score: number
        rank_position: number
        snapshot_date: string
    }
}

interface User {
    full_name: string
    email: string
}

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [userRes, businessRes] = await Promise.all([
                    api.get<User>("/users/me"),
                    api.get<Business[]>("/businesses/")
                ])
                setUser(userRes.data)
                setBusinesses(businessRes.data)
            } catch (error) {
                console.error("Failed to load dashboard data", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const totalReviews = businesses.reduce((acc, b) => acc + (b.review_count || 0), 0)
    const avgRating = businesses.length > 0
        ? (businesses.reduce((acc, b) => acc + (b.total_rating || 0), 0) / businesses.length).toFixed(1)
        : "0.0"

    const competitorComparisonData = [
        { name: "Siz", rating: Number(avgRating) || 0 },
        { name: "Ortalama", rating: 4.0 },
        { name: "Lider", rating: 4.8 },
    ]

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Icons.spinner className="h-10 w-10 animate-spin text-indigo-600" />
                    <p className="text-muted-foreground animate-pulse">Panel hazırlanıyor...</p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/50 min-h-screen"
        >
            {/* Header Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Hoş geldin, {user?.full_name?.split(' ')[0] || 'Girişimci'} 👋
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        İşte işletmelerinin performans özeti ve büyüme fırsatları.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => router.push("/business/search")} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-200 transition-all">
                        <Icons.plus className="mr-2 h-4 w-4" />
                        Yeni İşletme Ekle
                    </Button>
                </div>
            </motion.div>

            {businesses.length === 0 ? (
                <MotionCard delay={0.2} className="flex flex-col items-center justify-center p-16 text-center border-dashed border-2 bg-white/50 backdrop-blur-sm">
                    <div className="rounded-full bg-indigo-50 p-6 mb-6 ring-8 ring-indigo-50/50">
                        <Icons.store className="h-12 w-12 text-indigo-600" />
                    </div>
                    <CardTitle className="text-2xl mb-3">Henüz işletme eklemediniz</CardTitle>
                    <CardDescription className="mb-8 max-w-lg text-lg">
                        MapRank'in yapay zeka destekli analiz araçlarını kullanmak için ilk işletmenizi ekleyin.
                        Rakiplerinizi analiz edin ve sıralamanızı yükseltin.
                    </CardDescription>
                    <Button onClick={() => router.push("/business/search")} size="lg" className="h-12 px-8 text-lg bg-indigo-600 hover:bg-indigo-700">
                        İlk İşletmeni Ekle
                    </Button>
                </MotionCard>
            ) : (
                <div className="space-y-8">
                    {/* KPI Cards */}
                    <motion.div variants={container} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Toplam İşletme"
                            value={businesses.length}
                            subtext="Aktif takip edilen"
                            icon={Icons.store}
                            color="text-blue-600"
                            bg="bg-blue-50"
                        />
                        <StatCard
                            title="Toplam Yorum"
                            value={totalReviews}
                            subtext="Google Maps yorumları"
                            icon={Icons.messageSquare}
                            color="text-purple-600"
                            bg="bg-purple-50"
                        />
                        <StatCard
                            title="Ortalama Puan"
                            value={avgRating}
                            subtext="5 üzerinden"
                            icon={Icons.star}
                            color="text-yellow-600"
                            bg="bg-yellow-50"
                        />
                        <StatCard
                            title="MapRank Skoru"
                            value={businesses[0]?.latest_ranking?.score ? businesses[0].latest_ranking.score.toFixed(0) : "-"}
                            subtext="En son analizden"
                            icon={Icons.activity}
                            color="text-emerald-600"
                            bg="bg-emerald-50"
                        />
                    </motion.div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        {/* Tracked Businesses List */}
                        <motion.div variants={item} className="col-span-4">
                            <MotionCard className="h-full border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                                <CardHeader>
                                    <CardTitle>İşletmelerim</CardTitle>
                                    <CardDescription>
                                        Takip ettiğiniz işletmelerin durum özeti.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {businesses.map((business, i) => (
                                            <div key={business.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                                                            {business.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <p className="font-semibold leading-none text-base group-hover:text-indigo-700 transition-colors">{business.name}</p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground pl-10 max-w-[200px] sm:max-w-sm truncate">{business.address}</p>
                                                </div>
                                                <div className="text-right flex items-center gap-2 sm:gap-6">
                                                    <div className="text-center hidden sm:block">
                                                        <div className="text-xs font-medium text-muted-foreground mb-1">Puan</div>
                                                        <div className="font-bold bg-gray-100 px-2 py-1 rounded-md">{business.total_rating.toFixed(1)}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs font-medium text-muted-foreground mb-1">Skor</div>
                                                        <Badge variant={
                                                            (business.latest_ranking?.score || 0) >= 70 ? "default" :
                                                                (business.latest_ranking?.score || 0) >= 50 ? "secondary" : "destructive"
                                                        } className="text-sm px-2 py-1 h-auto">
                                                            {business.latest_ranking?.score ? business.latest_ranking.score.toFixed(0) : "-"}
                                                        </Badge>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="hover:bg-indigo-50 hover:text-indigo-600" onClick={() => router.push(`/business/analyze?place_id=${'google_place_id' in business ? (business as any).google_place_id : ''}`)}>
                                                        <Icons.arrowRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </MotionCard>
                        </motion.div>

                        {/* Competitor Comparison Chart */}
                        <motion.div variants={item} className="col-span-3">
                            <MotionCard className="h-full border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                                <CardHeader>
                                    <CardTitle>Rakip Analizi</CardTitle>
                                    <CardDescription>
                                        Sektör ortalamasına göre konumunuz.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full min-w-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={competitorComparisonData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                                <XAxis type="number" domain={[0, 5]} hide />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    width={80}
                                                    tick={{ fontSize: 13, fontWeight: 500, fill: "#6b7280" }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#f9fafb' }}
                                                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                                />
                                                <Bar dataKey="rating" radius={[0, 6, 6, 0]} barSize={24}>
                                                    {
                                                        competitorComparisonData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.name === "Siz" ? "#4f46e5" : "#e5e7eb"} />
                                                        ))
                                                    }
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </MotionCard>
                        </motion.div>
                    </div>
                </div>
            )}
        </motion.div>
    )
}

function StatCard({ title, value, subtext, icon: Icon, color, bg }: { title: string, value: string | number, subtext: string, icon: any, color: string, bg: string }) {
    return (
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                    <div className={`p-2 rounded-lg ${bg}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {subtext}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: "default" | "secondary" | "destructive" }) {
    let colorClass = "bg-indigo-100 text-indigo-700"
    if (variant === "secondary") colorClass = "bg-yellow-100 text-yellow-700"
    if (variant === "destructive") colorClass = "bg-red-100 text-red-700"

    return (
        <span className={`inline-flex items-center justify-center rounded-full border border-current px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${colorClass} ${className}`}>
            {children}
        </span>
    )
}
