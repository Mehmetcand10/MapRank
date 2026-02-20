'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

// Create motion versions of the Card components
const MotionCardBase = motion.create(Card);

interface MotionCardProps extends React.ComponentProps<typeof MotionCardBase> {
    delay?: number;
}

export function MotionCard({ className, delay = 0, ...props }: MotionCardProps) {
    return (
        <MotionCardBase
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={cn(
                "backdrop-blur-sm bg-white/90 dark:bg-slate-950/90 border-slate-200/60 dark:border-slate-800/60 shadow-lg hover:shadow-xl transition-shadow",
                className
            )}
            {...props}
        />
    );
}

export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
