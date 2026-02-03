// AISSU Beach Lounge - Admin Configurações
'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Settings, Phone, Mail, MapPin, Clock, Save } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function AdminConfiguracoesPage() {
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState({
        businessName: 'AISSU Beach Lounge',
        phone: '(12) 98289-6301',
        email: 'contato@aissu.com.br',
        address: 'Praia de Massaguaçu, Caraguatatuba-SP',
        openingHours: {
            weekdays: '10:00 - 22:00',
            saturday: '10:00 - 23:00',
            sunday: '10:00 - 20:00',
        },
    })

    const handleSave = async () => {
        setSaving(true)
        // Simulated save
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success('Configurações salvas!')
        setSaving(false)
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Configurações</h1>
                    <p className="text-[#8a5c3f]">Gerencie as configurações do sistema</p>
                </div>
                <Button onClick={handleSave} isLoading={saving}>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                </Button>
            </div>

            {/* Settings Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Business Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-[#d4a574]" />
                            Informações do Negócio
                        </CardTitle>
                        <CardDescription>Dados principais do estabelecimento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Nome do Negócio"
                            value={config.businessName}
                            onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                        />
                        <Input
                            label="Telefone"
                            value={config.phone}
                            onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                        />
                        <Input
                            label="E-mail"
                            type="email"
                            value={config.email}
                            onChange={(e) => setConfig({ ...config, email: e.target.value })}
                        />
                        <Input
                            label="Endereço"
                            value={config.address}
                            onChange={(e) => setConfig({ ...config, address: e.target.value })}
                        />
                    </CardContent>
                </Card>

                {/* Opening Hours */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-[#d4a574]" />
                            Horário de Funcionamento
                        </CardTitle>
                        <CardDescription>Defina os horários de operação</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Segunda a Sexta"
                            value={config.openingHours.weekdays}
                            onChange={(e) => setConfig({
                                ...config,
                                openingHours: { ...config.openingHours, weekdays: e.target.value }
                            })}
                        />
                        <Input
                            label="Sábado"
                            value={config.openingHours.saturday}
                            onChange={(e) => setConfig({
                                ...config,
                                openingHours: { ...config.openingHours, saturday: e.target.value }
                            })}
                        />
                        <Input
                            label="Domingo"
                            value={config.openingHours.sunday}
                            onChange={(e) => setConfig({
                                ...config,
                                openingHours: { ...config.openingHours, sunday: e.target.value }
                            })}
                        />
                    </CardContent>
                </Card>

                {/* Sistema */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sistema</CardTitle>
                        <CardDescription>Informações do sistema</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#8a5c3f]">Versão</span>
                            <span className="font-medium">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8a5c3f]">Ambiente</span>
                            <span className="font-medium">Desenvolvimento</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8a5c3f]">Última Atualização</span>
                            <span className="font-medium">Hoje</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
