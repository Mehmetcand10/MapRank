"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"

interface Plan {
    id: string
    name: string
    price: number
    features: string[]
}

interface TenantInfo {
    name: string
    plan_type: string
}

import { Suspense } from 'react'

function BillingContent() {
    const searchParams = useSearchParams()
    const [plans, setPlans] = useState<Plan[]>([])
    const [tenant, setTenant] = useState<TenantInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [plansRes, tenantRes] = await Promise.all([
                api.get<Plan[]>("/billing/plans"),
                api.get<TenantInfo>("/tenants/me")
            ])
            setPlans(plansRes.data)
            setTenant(tenantRes.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (planId: string) => {
        setProcessingId(planId)
        try {
            const response = await api.post<{ url: string }>("/billing/checkout", { plan_type: planId })
            window.location.href = response.data.url
        } catch (error) {
            console.error("Checkout failed", error)
            setProcessingId(null)
            alert("Failed to start checkout. Please try again.")
        }
    }

    const handleManageSubscription = async () => {
        setProcessingId("manage")
        try {
            const response = await api.post<{ url: string }>("/billing/portal")
            window.location.href = response.data.url
        } catch (error) {
            console.error("Portal failed", error)
            setProcessingId(null)
            alert("Failed to open billing portal.")
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6 container mx-auto py-10 max-w-5xl">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Billing & Subscription</h2>
                <p className="text-muted-foreground">
                    Manage your plan and billing details.
                </p>
            </div>

            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-md">
                    Subscription successful! Thank you for upgrading.
                </div>
            )}

            {canceled && (
                <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
                    Checkout canceled. No charges were made.
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.id} className={`flex flex-col ${tenant?.plan_type === plan.id ? 'border-primary border-2' : ''}`}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{plan.name}</CardTitle>
                                {tenant?.plan_type === plan.id && (
                                    <Badge variant="default">Current Plan</Badge>
                                )}
                            </div>
                            <CardDescription>
                                <span className="text-3xl font-bold">${plan.price}</span> / month
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-2 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center">
                                        <Icons.check className="mr-2 h-4 w-4 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {tenant?.plan_type === plan.id ? (
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={handleManageSubscription}
                                    disabled={!!processingId}
                                >
                                    {processingId === "manage" && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                                    Manage Subscription
                                </Button>
                            ) : (
                                <Button
                                    className="w-full"
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={!!processingId}
                                >
                                    {processingId === plan.id && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                                    {plan.price > 0 ? "Upgrade" : "Select Free"}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Icons.spinner className="h-8 w-8 animate-spin" /></div>}>
            <BillingContent />
        </Suspense>
    )
}
