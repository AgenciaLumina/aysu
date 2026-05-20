'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DEFAULT_SITE_CONTENT, parseSiteContentConfig } from '@/lib/site-content'
import { formatCurrency } from '@/lib/utils'

export default function EventPricingSection() {
    const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT)
    const eventsContent = siteContent.events

    useEffect(() => {
        let cancelled = false

        fetch('/api/site-content')
            .then((res) => res.json())
            .then((data) => {
                const payload = data?.data?.content ?? data?.data

                if (data?.success && payload && !cancelled) {
                    setSiteContent(parseSiteContentConfig(payload))
                }
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [])

    return (
        <section className="py-20 bg-[#2a2a2a] text-white">
            <div className="container-aissu">
                <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
                    <div>
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#f1c595]">
                            <CalendarDays className="h-4 w-4" />
                            {eventsContent.homeEventSection.eyebrow}
                        </div>

                        <h2 className="font-serif text-4xl font-light leading-tight md:text-5xl">
                            {eventsContent.homeEventSection.title}
                        </h2>
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
                            {eventsContent.homeEventSection.description}
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg">
                                <Link href="/eventos">
                                    {eventsContent.homeEventSection.ctaLabel}
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="!border-white/35 !text-white hover:!bg-white/10">
                                <Link href="/eventos#orcamento">
                                    {eventsContent.homeEventSection.secondaryCtaLabel}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {eventsContent.pricing.plans.map((plan, index) => (
                            <div
                                key={`${plan.name}-${index}`}
                                className={`flex min-h-[21rem] flex-col rounded-2xl p-6 shadow-xl ${
                                    plan.highlight
                                        ? 'bg-gradient-to-b from-[#d4a574] to-[#bc8e5e] text-white'
                                        : 'border border-white/10 bg-white/[0.06]'
                                }`}
                            >
                                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${plan.highlight ? 'text-white/80' : 'text-[#d4a574]'}`}>
                                    {plan.name}
                                </p>
                                <p className="mt-5 text-3xl font-bold">
                                    {formatCurrency(plan.price)}
                                </p>
                                <ul className="mt-6 space-y-3 text-sm">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={`${feature}-${featureIndex}`} className="flex items-start gap-2">
                                            <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-[#d4a574]'}`} />
                                            <span className={plan.highlight ? 'text-white/90' : 'text-white/70'}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
