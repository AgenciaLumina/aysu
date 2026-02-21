import Image from 'next/image'

export const metadata = {
    title: 'Site em Manutenção | Aysú Beach Lounge',
    description: 'Estamos atualizando nosso sistema para oferecer uma melhor experiência.',
}

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-[#E0D5C7]/50">

                <div className="flex justify-center mb-8">
                    <Image
                        src="/logo_aysu.png"
                        alt="Aysú Beach Lounge"
                        width={180}
                        height={60}
                        className="w-auto h-16 object-contain"
                        priority
                    />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-crimson font-bold text-[#2E1E16]">
                        Estamos em Manutenção
                    </h1>

                    <p className="text-[#5C4A3D] text-lg font-poppins">
                        Nosso site está temporariamente fora do ar.
                    </p>
                    <p className="text-[#5C4A3D] font-poppins text-sm leading-relaxed">
                        Estamos realizando uma atualização no sistema para melhorar sua experiência.
                        Voltaremos em breve.
                    </p>
                </div>

                <div className="pt-8 border-t border-[#E0D5C7]/50">
                    <p className="text-sm font-poppins text-[#8C7A6B]">
                        Dúvidas? Entre em contato pelo nosso{' '}
                        <a
                            href="https://wa.me/5512999999999"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#D84315] hover:underline font-medium"
                        >
                            WhatsApp
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}
