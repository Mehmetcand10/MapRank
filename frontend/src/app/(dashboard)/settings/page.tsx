"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icons } from "@/components/icons"

interface UserProfile {
    email: string
    role: string
}

interface TenantInfo {
    name: string
    plan_type: string
}

export default function SettingsPage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [tenant, setTenant] = useState<TenantInfo | null>(null)
    const [loading, setLoading] = useState(true)

    // Forms
    const [newEmail, setNewEmail] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [tenantName, setTenantName] = useState("")

    // Status
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [userRes, tenantRes] = await Promise.all([
                api.get<UserProfile>("/users/me"),
                api.get<TenantInfo>("/tenants/me")
            ])
            setUser(userRes.data)
            setTenant(tenantRes.data)
            setNewEmail(userRes.data.email)
            setTenantName(tenantRes.data.name)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus(null)
        try {
            await api.put("/users/me", { email: newEmail })
            setStatus({ type: 'success', message: "Profile updated successfully." })
        } catch (error) {
            setStatus({ type: 'error', message: "Failed to update profile." })
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus(null)
        try {
            await api.post("/users/change-password", {
                current_password: currentPassword,
                new_password: newPassword
            })
            setStatus({ type: 'success', message: "Password changed successfully." })
            setCurrentPassword("")
            setNewPassword("")
        } catch (error) {
            setStatus({ type: 'error', message: "Failed to change password. check current password." })
        }
    }

    const handleUpdateTenant = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus(null)
        try {
            await api.put("/tenants/me", { name: tenantName })
            setStatus({ type: 'success', message: "Tenant info updated successfully." })
        } catch (error) {
            setStatus({ type: 'error', message: "Failed to update tenant info. You might not have permission." })
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
        <div className="space-y-6 container mx-auto py-10 max-w-4xl">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and tenant preferences.
                </p>
            </div>

            {status && (
                <div className={`p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {status.message}
                </div>
            )}

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">Profile & Security</TabsTrigger>
                    <TabsTrigger value="tenant">Team & Tenant</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>
                                Update your personal details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                                </div>
                                <Button type="submit">Update Profile</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Password</CardTitle>
                            <CardDescription>
                                Change your password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current">Current Password</Label>
                                    <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new">New Password</Label>
                                    <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                </div>
                                <Button type="submit">Change Password</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tenant" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tenant Information</CardTitle>
                            <CardDescription>
                                Manage your organization details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateTenant} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="tenantName">Organization Name</Label>
                                    <Input id="tenantName" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Current Plan</Label>
                                    <div className="p-2 border rounded-md bg-muted">
                                        {tenant?.plan_type}
                                    </div>
                                </div>
                                <Button type="submit">Update Organization</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
