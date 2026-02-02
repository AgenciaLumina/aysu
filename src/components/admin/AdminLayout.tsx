'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Calendar,
    UtensilsCrossed,
    Home,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Bell,
    User,
    CreditCard,
    ImageIcon,
    FolderOpen,
    Umbrella
} from 'lucide-react'

interface AdminLayoutProps {
    children: React.ReactNode
}

const navItems = [
    { href: '/admin/frente-de-caixa', label: 'Frente de Caixa', icon: CreditCard },
    { href: '/admin/reservas', label: 'Reservas', icon: Calendar },
    { href: '/admin/menu-gallery', label: 'Galeria Menu', icon: ImageIcon },
    { href: '/admin/galeria', label: 'Galeria Site', icon: ImageIcon },
    { href: '/admin/midia', label: 'Mídia R2', icon: FolderOpen },
    { href: '/admin/espacos', label: 'Espaços', icon: Home },
    { href: '/admin/day-use', label: 'Day Use', icon: Umbrella },
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; time: string; unread: boolean }[]>([])

    const isActive = (href: string) => pathname?.startsWith(href)

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await fetch('/api/admin/reservations/pending')
                const data = await res.json()
                if (data.success && data.data) {
                    setNotifications(data.data.map((r: any) => {
                        const created = new Date(r.createdAt)
                        const now = new Date()
                        const diffMin = Math.floor((now.getTime() - created.getTime()) / 60000)
                        const time = diffMin < 60 ? `${diffMin} min` : `${Math.floor(diffMin / 60)}h`
                        return {
                            id: r.id,
                            title: 'Reserva pendente',
                            message: `${r.customerName} - ${r.spaceName}`,
                            time,
                            unread: true,
                        }
                    }))
                }
            } catch {}
        }
        fetchPending()
        const interval = setInterval(fetchPending, 30000)
        return () => clearInterval(interval)
    }, [])

    const unreadCount = notifications.filter(n => n.unread).length

    return (
        <div className="min-h-screen bg-[#f8f6f3] flex">
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full bg-[#2a2a2a] text-white transition-all duration-300 z-50 flex flex-col ${isCollapsed ? 'w-16' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <Image
                        src="/logo_aysu.png"
                        alt="Aysú"
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                    {!isCollapsed && (
                        <div>
                            <p className="font-serif font-bold">Aysú</p>
                            <p className="text-xs text-white/50">Admin Panel</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${active
                                    ? 'bg-[#d4a574] text-white'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                {!isCollapsed && <span className="text-sm">{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Collapse Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-4 border-t border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <>
                            <ChevronLeft className="h-5 w-5" />
                            <span className="ml-2 text-sm">Recolher</span>
                        </>
                    )}
                </button>

                {/* Settings & Logout */}
                <div className="border-t border-white/10">
                    <Link
                        href="/admin/configuracoes"
                        className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        title={isCollapsed ? 'Configurações' : undefined}
                    >
                        <Settings className="h-5 w-5" />
                        {!isCollapsed && <span className="text-sm">Configurações</span>}
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        title={isCollapsed ? 'Voltar ao Site' : undefined}
                    >
                        <LogOut className="h-5 w-5" />
                        {!isCollapsed && <span className="text-sm">Voltar ao Site</span>}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-[#e0d5c7] sticky top-0 z-40 flex items-center justify-between px-6">
                    <div>
                        {/* Breadcrumb placeholder */}
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-[#8a5c3f] hover:bg-[#f5f0e8] rounded-lg transition-colors"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowNotifications(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-[#e0d5c7] z-50 overflow-hidden">
                                        <div className="p-4 border-b border-[#e0d5c7] flex items-center justify-between">
                                            <h3 className="font-semibold text-[#2a2a2a]">Notificações</h3>
                                            {unreadCount > 0 && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                                    {unreadCount} novas
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-[#8a5c3f]">
                                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">Nenhuma notificação</p>
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        className={`p-4 border-b border-[#f5f0e8] hover:bg-[#faf8f5] cursor-pointer transition-colors ${notif.unread ? 'bg-[#faf8f5]' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {notif.unread && (
                                                                <span className="w-2 h-2 bg-[#d4a574] rounded-full mt-2 flex-shrink-0" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-[#2a2a2a]">{notif.title}</p>
                                                                <p className="text-xs text-[#8a5c3f] mt-0.5">{notif.message}</p>
                                                                <p className="text-xs text-[#b0a090] mt-1">{notif.time} atrás</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="p-3 border-t border-[#e0d5c7] bg-[#faf8f5]">
                                            <Link href="/admin/frente-de-caixa" className="w-full text-center text-sm text-[#d4a574] hover:text-[#c49464] font-medium block" onClick={() => setShowNotifications(false)}>
                                                Ver no Frente de Caixa
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* User */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#d4a574] flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-[#2a2a2a]">Admin</p>
                                <p className="text-xs text-[#8a5c3f]">Gerente</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
