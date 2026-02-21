"use client"

import * as React from "react"
import { useRouter } from "next/navigation" // Add import
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import api from "@/lib/api"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    type: "login" | "register"
}

export function UserAuthForm({ className, type, ...props }: UserAuthFormProps) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)

    const router = useRouter() // Import from next/navigation

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)

        const target = event.target as typeof event.target & {
            email: { value: string };
            password: { value: string };
        }

        const email = target.email.value
        const password = target.password.value

        try {
            if (type === "register") {
                await api.post("/auth/register", {
                    email,
                    password
                })

                alert("Account created! Please sign in.")
                router.push('/login')
            } else {
                // Login
                const params = new URLSearchParams()
                params.append('username', email)
                params.append('password', password)

                const response = await api.post("/auth/login/access-token", params)

                localStorage.setItem('token', response.data.access_token)

                // Force a hard refresh/navigation to ensure state is picked up
                window.location.href = '/dashboard'
            }
        } catch (error: any) {
            console.error("Auth Error Details:", error.response?.data)
            const detail = error.response?.data?.detail
            const errorMessage = typeof detail === 'string'
                ? detail
                : (Array.isArray(detail) ? JSON.stringify(detail) : (error.message || "An error occurred."))
            alert(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            name="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                        />
                    </div>
                    {type === "register" && (
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                disabled={isLoading}
                            />
                        </div>
                    )}
                    {type === "login" && (
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                disabled={isLoading}
                            />
                        </div>
                    )}
                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {type === "login" ? "Sign In" : "Create Account"}
                    </Button>
                </div>
            </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">
                        Or continue with
                    </span>
                </div>
            </div>
            <Button variant="outline" type="button" disabled={isLoading}>
                {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Icons.google className="mr-2 h-4 w-4" />
                )}{" "}
                Google
            </Button>
        </div>
    )
}
