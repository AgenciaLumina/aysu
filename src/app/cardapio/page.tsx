// AISSU Beach Lounge - Cardápio Premium
// Design com Header/Footer padrão

'use client'

import { useState, useEffect } from 'react'
import { Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/lib/utils'

interface MenuItem {
    id: string
    name: string
    description: string
    price: number
    imageUrl?: string
    isAvailable: boolean
    preparationTime?: number
    tags: string[]
    allergyInfo: string[]
    category: { id: string; name: string; slug: string }
}

interface MenuCategory {
    id: string
    name: string
    slug: string
    description: string
    items: MenuItem[]
}

export default function CardapioPage() {
    const [categories, setCategories] = useState<MenuCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        async function fetchMenu() {
            try {
                const res = await fetch('/api/menu/categories?includeItems=true&onlyAvailable=true')
                const data = await res.json()
                if (data.success) setCategories(data.data)
            } catch (error) {
                console.error('Erro ao carregar cardápio:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchMenu()
    }, [])

    const filteredCategories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
            (activeCategory === 'all' || cat.slug === activeCategory) &&
            (searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    })).filter(cat => cat.items.length > 0 || activeCategory === 'all')

    return (
        <div className="min-h-screen bg-[#fdfbf8]">
            <Header variant="solid" />

            {/* Hero com busca */}
            <section className="py-16 lg:py-20 border-b border-[#e8e0d5]">
                <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
                    <p className="text-[#d4a574] text-sm tracking-[0.3em] uppercase mb-4">Gastronomia Caiçara</p>
                    <h1 className="font-serif text-4xl lg:text-5xl font-light text-[#2a2a2a] mb-6 leading-tight">
                        Sabores do Litoral
                    </h1>
                    <p className="text-[#8a5c3f] text-lg leading-relaxed max-w-xl mx-auto mb-8">
                        Ingredientes frescos da região combinados com técnicas contemporâneas.
                    </p>

                    {/* Busca centralizada */}
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#b0a090]" />
                        <input
                            type="text"
                            placeholder="Buscar no cardápio..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 text-base bg-white border border-[#e8e0d5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30 shadow-sm"
                        />
                    </div>
                </div>
            </section>

            {/* Category Navigation com setas */}
            <div className="sticky top-[72px] bg-[#fdfbf8]/95 backdrop-blur-sm border-b border-[#e8e0d5] z-40">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center gap-2 py-4">
                        {/* Seta esquerda */}
                        <button
                            onClick={() => {
                                const container = document.getElementById('category-scroll')
                                if (container) container.scrollBy({ left: -200, behavior: 'smooth' })
                            }}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#e8e0d5] flex items-center justify-center text-[#8a5c3f] hover:bg-[#f5f0e8] hover:border-[#d4a574] transition-all shadow-sm"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        {/* Category pills */}
                        <div
                            id="category-scroll"
                            className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1"
                        >
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === 'all'
                                    ? 'bg-[#2a2a2a] text-white shadow-md'
                                    : 'bg-white text-[#8a5c3f] hover:bg-[#f1ebe3] border border-[#e8e0d5]'
                                    }`}
                            >
                                Todos
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.slug)}
                                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat.slug
                                        ? 'bg-[#2a2a2a] text-white shadow-md'
                                        : 'bg-white text-[#8a5c3f] hover:bg-[#f1ebe3] border border-[#e8e0d5]'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Seta direita */}
                        <button
                            onClick={() => {
                                const container = document.getElementById('category-scroll')
                                if (container) container.scrollBy({ left: 200, behavior: 'smooth' })
                            }}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#e8e0d5] flex items-center justify-center text-[#8a5c3f] hover:bg-[#f5f0e8] hover:border-[#d4a574] transition-all shadow-sm"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Menu Content */}
            <main className="max-w-5xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Spinner size="lg" />
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-32">
                        <p className="text-[#8a5c3f]">Nenhum item encontrado.</p>
                    </div>
                ) : (
                    <div className="space-y-20">
                        {filteredCategories.map(category => (
                            category.items.length > 0 && (
                                <section key={category.id}>
                                    {activeCategory === 'all' && (
                                        <div className="mb-10 pb-4 border-b border-[#e8e0d5]">
                                            <h3 className="font-serif text-2xl lg:text-3xl font-light text-[#2a2a2a] mb-2">
                                                {category.name}
                                            </h3>
                                            {category.description && (
                                                <p className="text-[#8a5c3f] text-sm">{category.description}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {category.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="group bg-white rounded-xl p-4 border border-[#f0e8dd] hover:border-[#d4a574]/50 hover:shadow-lg transition-all duration-300"
                                            >
                                                <div className="flex gap-5">
                                                    {/* Image Left */}
                                                    <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-[#f5f0e8] relative">
                                                        {item.imageUrl ? (
                                                            <img
                                                                src={item.imageUrl}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-[#d4a574]/30">
                                                                <Sparkles className="h-6 w-6" />
                                                            </div>
                                                        )}
                                                        {item.tags?.includes('popular') && (
                                                            <div className="absolute top-0 right-0">
                                                                <span className="bg-[#d4a574] text-white text-[10px] px-1.5 py-0.5 rounded-bl-md font-medium">Top</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content Right */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <div className="flex justify-between items-baseline gap-4 mb-1">
                                                            <h4 className="font-serif text-lg lg:text-xl font-medium text-[#2a2a2a] group-hover:text-[#d4a574] transition-colors">
                                                                {item.name}
                                                            </h4>

                                                            {/* Dotted Line */}
                                                            <div className="hidden sm:block flex-1 border-b border-dotted border-[#e0d5c7] h-px self-center mx-2 opacity-50"></div>

                                                            <span className="font-serif text-lg text-[#d4a574] whitespace-nowrap font-semibold">
                                                                {formatCurrency(item.price)}
                                                            </span>
                                                        </div>

                                                        {item.description && (
                                                            <p className="text-[#8a5c3f] text-sm leading-relaxed mb-3 line-clamp-2">
                                                                {item.description}
                                                            </p>
                                                        )}

                                                        {item.tags?.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-auto">
                                                                {item.tags.slice(0, 3).map((tag: string) => (
                                                                    <span
                                                                        key={tag}
                                                                        className="text-xs text-[#a09080] bg-[#faf8f5] px-2 py-0.5 rounded-full border border-[#f0e8dd]"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )
                        ))}
                    </div>
                )}
            </main>

            {/* Footer CTA */}
            <section className="bg-[#2a2a2a] py-20">
                <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
                    <Sparkles className="h-6 w-6 text-[#d4a574] mx-auto mb-6" />
                    <h3 className="font-serif text-3xl lg:text-4xl font-light text-white mb-4">
                        Valor Revertido em Consumação
                    </h3>
                    <p className="text-white/60 mb-10 max-w-md mx-auto leading-relaxed">
                        Reserve seu espaço e aproveite nosso cardápio com todo o valor do day use convertido em consumo.
                    </p>
                    <a href="/reservas">
                        <button className="bg-[#d4a574] text-white px-10 py-4 rounded-full font-medium tracking-wide hover:bg-[#c49664] transition-all hover:shadow-lg">
                            Fazer Reserva
                        </button>
                    </a>
                </div>
            </section>

            <Footer />
        </div>
    )
}
