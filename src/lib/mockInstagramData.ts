// Mock Instagram Data for Development
// Phase 1: Hardcoded data, Phase 2: Replace with Graph API

export interface InstagramStory {
    id: string
    username: string
    avatar: string
    hasUnseenStory: boolean
    instagramUrl: string
}

export interface InstagramPost {
    id: string
    mediaUrl: string
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
    caption: string
    permalink: string
    timestamp: string
    likeCount?: number
    commentsCount?: number
}

// Stories mock data
export const MOCK_INSTAGRAM_STORIES: InstagramStory[] = [
    {
        id: '1',
        username: 'aysu_beachlounge',
        avatar: '/logo_aysu.png',
        hasUnseenStory: true,
        instagramUrl: 'https://instagram.com/aysu_beachlounge'
    }
]

// Feed posts mock data
export const MOCK_INSTAGRAM_POSTS: InstagramPost[] = [
    {
        id: '1',
        mediaUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=800&fit=crop',
        mediaType: 'IMAGE',
        caption: 'Pé na areia, sol na alma ☀️🌴 #AysuBeachLounge #TropicalLuxury',
        permalink: 'https://instagram.com/p/aysu1',
        timestamp: '2026-01-19T09:00:00Z',
        likeCount: 324,
        commentsCount: 28
    },
    {
        id: '2',
        mediaUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=800&fit=crop',
        mediaType: 'IMAGE',
        caption: 'Guia do AYSU - Conheça um dia perfeito aqui 🌅 #BeachLife #Massaguaçu',
        permalink: 'https://instagram.com/p/aysu2',
        timestamp: '2026-01-18T14:30:00Z',
        likeCount: 456,
        commentsCount: 42
    },
    {
        id: '3',
        mediaUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=800&fit=crop',
        mediaType: 'IMAGE',
        caption: 'Drinks tropicais que aquecem a alma 🍹✨ #CaiçaraCuisine',
        permalink: 'https://instagram.com/p/aysu3',
        timestamp: '2026-01-17T16:45:00Z',
        likeCount: 289,
        commentsCount: 19
    },
    {
        id: '4',
        mediaUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=800&fit=crop',
        mediaType: 'IMAGE',
        caption: 'Lounges premium com vista para o mar 🌊 #Relaxamento',
        permalink: 'https://instagram.com/p/aysu4',
        timestamp: '2026-01-16T11:20:00Z',
        likeCount: 512,
        commentsCount: 37
    },
    {
        id: '5',
        mediaUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=800&fit=crop',
        mediaType: 'IMAGE',
        caption: 'Piscina infinita com céu de Caraguá 💙☁️ #Infinity',
        permalink: 'https://instagram.com/p/aysu5',
        timestamp: '2026-01-15T10:00:00Z',
        likeCount: 678,
        commentsCount: 54
    },
    {
        id: '6',
        mediaUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=800&fit=crop',
        mediaType: 'IMAGE',
        caption: 'Gastronomia caiçara de alto nível 🐟🔥 #FreshSeafood',
        permalink: 'https://instagram.com/p/aysu6',
        timestamp: '2026-01-14T18:30:00Z',
        likeCount: 401,
        commentsCount: 31
    }
]
