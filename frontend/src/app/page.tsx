"use client"

import Link from "next/link"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Home() {
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="px-6 h-16 flex items-center justify-between border-b border-gray-100/50 backdrop-blur-md sticky top-0 z-50 bg-white/80">
        <div className="flex items-center space-x-2 font-bold text-xl text-indigo-900">
          <Icons.logo className="h-6 w-6" />
          <span>MapRank</span>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
          <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
          <Link href="#about" className="hover:text-indigo-600 transition-colors">About</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Login</Link>
          <Link href="/register">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-indigo-50/50">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="container px-4 md:px-6 relative z-10"
          >
            <div className="flex flex-col items-center space-y-8 text-center">
              <motion.div variants={item} className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800">
                🚀 Now available in Turkey
              </motion.div>
              <motion.h1 variants={item} className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600 pb-2">
                Dominate Local Search <br /> with AI Intelligence
              </motion.h1>
              <motion.p variants={item} className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Analyze your Google Maps ranking, spy on competitors, and get actionable insights to reach #1.
                MapRank is the intelligence engine for local businesses.
              </motion.p>
              <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all">
                    Start Ranking Higher
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg h-12 px-8 bg-white border border-gray-200 hover:bg-gray-50">
                    View Live Demo
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Decorative Gradient Blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-200/30 rounded-full blur-3xl -z-10 animate-pulse" />
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-12 lg:grid-cols-3"
            >
              <motion.div variants={item} className="group flex flex-col space-y-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <Icons.mapPin className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Precise Rank Tracking</h3>
                <p className="text-gray-500">Track your exact position on Google Maps for any keyword in any neighborhood. See what your customers see.</p>
              </motion.div>
              <motion.div variants={item} className="group flex flex-col space-y-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <Icons.trending className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Competitor Spy</h3>
                <p className="text-gray-500">Analyze why your competitors rank higher. Compare reviews, photos, and categories instantly.</p>
              </motion.div>
              <motion.div variants={item} className="group flex flex-col space-y-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <Icons.check className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Actionable Insights</h3>
                <p className="text-gray-500">Don't just see data. Get a concrete to-do list powered by our algorithm to improve your SEO.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 md:py-16 bg-gray-50">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © 2026 MapRank Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
