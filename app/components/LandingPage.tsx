import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col font-sans text-foreground bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <span className="text-xl font-bold tracking-tight text-primary-dark">EcoTracker</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="#" className="hover:text-primary transition-colors">Dashboard</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Map</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Community</Link>
                        <Link href="#" className="hover:text-primary transition-colors">About</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/Auth/login" className="text-sm font-medium hover:text-primary transition-colors">
                            Log in
                        </Link>
                        <Link
                            href="/Auth/register"
                            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 md:py-32 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-light/10 to-transparent rounded-l-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-accent/20 rounded-r-full blur-3xl" />
                    </div>

                    <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
                        <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-sm text-primary mb-8 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                            Smart Municipality Tracking System
                        </div>

                        <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
                            Building a <span className="text-primary">Sustainable</span> Future Together
                        </h1>

                        <p className="max-w-2xl text-lg md:text-xl text-foreground/80 mb-10 leading-relaxed">
                            Track waste management, monitor city resources, and participate in community initiatives. Join us in making our city cleaner, greener, and smarter.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link
                                href="/Auth/register"
                                className="px-8 py-3 rounded-full bg-primary text-white font-semibold text-lg hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Get Started
                            </Link>
                            <Link
                                href="#"
                                className="px-8 py-3 rounded-full bg-surface border border-border text-foreground font-semibold text-lg hover:bg-surface-dim transition-all shadow-sm hover:shadow-md"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-surface-dim/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-dark">Smart Features</h2>
                            <p className="text-foreground/70 max-w-2xl mx-auto">
                                Everything you need to stay connected with your city's sustainability efforts.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    title: "Live Tracking",
                                    description: "Real-time monitoring of waste collection vehicles and city services.",
                                    icon: (
                                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 009 7v13" />
                                        </svg>
                                    )
                                },
                                {
                                    title: "Citizen Dashboard",
                                    description: "Personalized dashboard to view your contributions and report issues.",
                                    icon: (
                                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )
                                },
                                {
                                    title: "Instant Alerts",
                                    description: "Get notified about collection schedules and important community updates.",
                                    icon: (
                                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    )
                                }
                            ].map((feature, i) => (
                                <div key={i} className="bg-surface p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center mb-6">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                                    <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-primary-dark/5 py-12 border-t border-border">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                                    S
                                </div>
                                <span className="text-lg font-bold tracking-tight text-primary-dark">EcoTracker</span>
                            </div>
                            <p className="text-foreground/60 max-w-sm">
                                Empowering communities to build a sustainable future through smart technology and active participation.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 text-foreground">Platform</h4>
                            <ul className="space-y-2 text-sm text-foreground/70">
                                <li><Link href="#" className="hover:text-primary">Features</Link></li>
                                <li><Link href="#" className="hover:text-primary">Downloads</Link></li>
                                <li><Link href="#" className="hover:text-primary">Integration</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 text-foreground">Community</h4>
                            <ul className="space-y-2 text-sm text-foreground/70">
                                <li><Link href="#" className="hover:text-primary">Events</Link></li>
                                <li><Link href="#" className="hover:text-primary">Blog</Link></li>
                                <li><Link href="#" className="hover:text-primary">Forum</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground/50">
                        <p>&copy; 2026 EcoTracker. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                            <Link href="#" className="hover:text-primary">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
