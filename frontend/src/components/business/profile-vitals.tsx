"use client"

import { Icons } from "@/components/icons"
import { MotionCard } from "@/components/ui/motion-card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Vitals {
    health_score: number
    completeness: number
    checks: Record<string, boolean>
}

export function ProfileVitalsWidget({ vitals }: { vitals: Vitals }) {
    if (!vitals) return null

    const checkLabels: Record<string, string> = {
        has_website: "Web Sitesi Bağlantısı",
        has_phone: "Telefon Bilgisi",
        has_photos: "Zengin Fotoğraf İçeriği",
        has_reviews: "Müşteri Etkileşimi",
        has_opening_hours: "Çalışma Saatleri",
        is_verified: "Google Doğrulama Durumu"
    }

    return (
        <MotionCard className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Profil Sağlık Denetimi</h3>
                        <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">İşletme Karnesi</p>
                    </div>
                    <div className="h-16 w-16 rounded-full border-4 border-indigo-50 dark:border-indigo-900/30 flex items-center justify-center">
                        <span className="text-xl font-black text-indigo-600">%{Math.round(vitals.health_score)}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                        <span>Doluluk Oranı</span>
                        <span>%{Math.round(vitals.completeness)}</span>
                    </div>
                    <Progress value={vitals.completeness} className="h-2 bg-slate-100 dark:bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(vitals.checks).map(([key, passed]) => (
                        <div key={key} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                            <div className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                                passed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                            )}>
                                {passed ? <Icons.check className="h-3 w-3" /> : <Icons.minus className="h-3 w-3" />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase leading-none">
                                {checkLabels[key] || key}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold leading-relaxed">
                        <Icons.bot className="h-3 w-3 inline mr-1" />
                        AI Önerisi: {vitals.health_score < 70 ? "Profilinizde kritik eksikler var. Bu durum harita görünürlüğünüzü %30 kısıtlıyor." : "Profiliniz oldukça güçlü. Daha fazla fotoğraf ekleyerek %100'e ulaşabilirsiniz."}
                    </p>
                </div>
            </div>
        </MotionCard>
    )
}
