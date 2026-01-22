'use client'

import { MOCK_INSTAGRAM_STORIES } from '@/lib/mockInstagramData'
import Image from 'next/image'
import { Instagram } from 'lucide-react'

export default function InstagramStories() {
    return (
        <div className="relative">
            {/* Stories Container com scroll horizontal - CENTRALIZADO */}
            <div className="flex justify-center gap-4 overflow-x-auto scrollbar-hide py-4 px-4">
                {MOCK_INSTAGRAM_STORIES.map((story) => (
                    <a
                        key={story.id}
                        href={story.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 flex-shrink-0 group"
                        aria-label={`Ver Stories do ${story.username} no Instagram`}
                    >
                        {/* Story Circle com Gradiente Instagram */}
                        <div className="relative transition-all duration-300 ease-out group-hover:scale-110">
                            {/* Gradiente animado */}
                            <div
                                className={`
                  w-20 h-20 md:w-24 md:h-24 rounded-full p-[3px]
                  bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]
                  transition-all duration-300 ease-out
                  ${story.hasUnseenStory ? 'opacity-100' : 'opacity-40'}
                  group-hover:shadow-lg group-hover:shadow-[#f09433]/30
                `}
                            >
                                {/* Avatar Container */}
                                <div className="w-full h-full rounded-full bg-aissu-cream p-[3px]">
                                    <div className="relative w-full h-full rounded-full overflow-hidden">
                                        <Image
                                            src={story.avatar}
                                            alt={story.username}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 80px, 96px"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Instagram Icon Badge */}
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-[#f09433] to-[#bc1888] rounded-full p-1.5 shadow-md">
                                <Instagram className="w-3 h-3 text-white" />
                            </div>
                        </div>

                        {/* Username */}
                        <span className="text-xs md:text-sm font-medium text-aissu-chocolate max-w-[80px] md:max-w-[96px] truncate">
                            {story.username}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    )
}
