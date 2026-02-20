"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface BusinessResult {
    google_place_id: string
    name: string
    address: string
    rating: number
    user_ratings_total: number
    maprank_score?: number
}

export default function SearchPage() {
    const router = useRouter()
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<BusinessResult[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setError(null)
        setResults([])

        try {
            // Hardcoded location for now as per MVP
            const response = await api.get<BusinessResult[]>(`/businesses/search?query=${encodeURIComponent(query)}&location=Turkey`)
            setResults(response.data)
        } catch (err: any) {
            console.error("Search failed:", err)
            setError(err.response?.data?.detail || "Search failed. Please try again or check your connection.")
        } finally {
            setLoading(false)
            setHasSearched(true)
        }
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Business Search</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Find Competitors & Analyze Ranking</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
                        <Input
                            type="text"
                            placeholder="e.g. Burger King Kadıköy"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : <Icons.logo className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((biz) => (
                    <Card key={biz.google_place_id} className="overflow-hidden">
                        <div className="h-2 bg-indigo-500" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-md font-bold truncate">
                                {biz.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground mb-4 h-10 overflow-hidden">
                                {biz.address}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Google Rating</span>
                                    <span className="font-bold flex items-center">
                                        {biz.rating}
                                        <span className="text-xs font-normal ml-1 text-gray-500">({biz.user_ratings_total})</span>
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-muted-foreground">MapRank Score</span>
                                    <span className={`font-bold text-lg ${biz.maprank_score && biz.maprank_score > 70 ? 'text-green-600' : 'text-orange-500'}`}>
                                        {biz.maprank_score || "N/A"}
                                    </span>
                                </div>
                            </div>
                            <Button
                                className="w-full mt-4"
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/business/analyze?place_id=${biz.google_place_id}&name=${encodeURIComponent(biz.name)}`)}
                            >
                                Analyze Details
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {hasSearched && !error && results.length === 0 && !loading && (
                <div className="text-center py-10 text-gray-500">
                    No results found. Try a different query.
                </div>
            )}
        </div>
    )
}
