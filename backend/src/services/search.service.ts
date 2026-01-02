import { PrismaClient } from '@prisma/client';

interface SearchInput {
  q: string;
  type: 'users' | 'stories' | 'all';
  page: number;
  limit: number;
}

interface SearchUser {
  id: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
  bio: string | null;
  followersCount: number;
}

interface SearchStory {
  id: string;
  description: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  thumbnailUrl: string | null;
  location: string;
  likesCount: number;
  createdAt: Date;
  user: {
    id: string;
    nombre: string;
    avatar: string | null;
  };
}

interface TrendingHashtag {
  hashtag: string;
  count: number;
}

export class SearchService {
  constructor(private prisma: PrismaClient) {}

  // Extract hashtags from text
  private extractHashtags(text: string): string[] {
    const matches = text.match(/#[\wáéíóúñÁÉÍÓÚÑ]+/g);
    return matches ? matches.map((h) => h.toLowerCase()) : [];
  }

  // Search users
  async searchUsers(query: string, page: number, limit: number): Promise<SearchUser[]> {
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        avatar: true,
        bio: true,
        _count: {
          select: { followers: true },
        },
      },
      orderBy: {
        followers: { _count: 'desc' },
      },
      skip,
      take: limit,
    });

    return users.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      avatar: u.avatar,
      bio: u.bio,
      followersCount: u._count.followers,
    }));
  }

  // Search stories
  async searchStories(query: string, page: number, limit: number): Promise<SearchStory[]> {
    const skip = (page - 1) * limit;

    const stories = await this.prisma.story.findMany({
      where: {
        OR: [
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        description: true,
        mediaUrl: true,
        mediaType: true,
        thumbnailUrl: true,
        location: true,
        createdAt: true,
        _count: {
          select: { likes: true },
        },
        user: {
          select: { id: true, nombre: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return stories.map((s) => ({
      id: s.id,
      description: s.description,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      thumbnailUrl: s.thumbnailUrl,
      location: s.location,
      likesCount: s._count.likes,
      createdAt: s.createdAt,
      user: s.user,
    }));
  }

  // Combined search
  async search(input: SearchInput): Promise<{ users: SearchUser[]; stories: SearchStory[]; hasMore: boolean }> {
    const { q, type, page, limit } = input;

    let users: SearchUser[] = [];
    let stories: SearchStory[] = [];

    if (type === 'users' || type === 'all') {
      users = await this.searchUsers(q, page, type === 'users' ? limit : Math.floor(limit / 2));
    }

    if (type === 'stories' || type === 'all') {
      stories = await this.searchStories(q, page, type === 'stories' ? limit : Math.floor(limit / 2));
    }

    // hasMore is true if any result set is at limit
    const hasMore = users.length >= (type === 'users' ? limit : Math.floor(limit / 2)) ||
                    stories.length >= (type === 'stories' ? limit : Math.floor(limit / 2));

    return { users, stories, hasMore };
  }

  // Get trending hashtags (from recent stories)
  async getTrendingHashtags(limit: number = 10): Promise<TrendingHashtag[]> {
    // Get stories from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const stories = await this.prisma.story.findMany({
      where: {
        createdAt: { gte: weekAgo },
      },
      select: { description: true },
    });

    // Extract and count hashtags
    const hashtagCounts = new Map<string, number>();

    for (const story of stories) {
      const hashtags = this.extractHashtags(story.description);
      for (const hashtag of hashtags) {
        hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1);
      }
    }

    // Sort by count and return top N
    return Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([hashtag, count]) => ({ hashtag, count }));
  }

  // Get trending stories (most liked in last 7 days)
  async getTrendingStories(limit: number = 10): Promise<SearchStory[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const stories = await this.prisma.story.findMany({
      where: {
        createdAt: { gte: weekAgo },
      },
      select: {
        id: true,
        description: true,
        mediaUrl: true,
        mediaType: true,
        thumbnailUrl: true,
        location: true,
        createdAt: true,
        _count: {
          select: { likes: true },
        },
        user: {
          select: { id: true, nombre: true, avatar: true },
        },
      },
      orderBy: {
        likes: { _count: 'desc' },
      },
      take: limit,
    });

    return stories.map((s) => ({
      id: s.id,
      description: s.description,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      thumbnailUrl: s.thumbnailUrl,
      location: s.location,
      likesCount: s._count.likes,
      createdAt: s.createdAt,
      user: s.user,
    }));
  }

  // Get suggestions (autocomplete)
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    // Search for users and locations that match
    const [users, stories] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          nombre: { startsWith: query, mode: 'insensitive' },
        },
        select: { nombre: true },
        take: limit,
      }),
      this.prisma.story.findMany({
        where: {
          location: { startsWith: query, mode: 'insensitive' },
        },
        select: { location: true },
        distinct: ['location'],
        take: limit,
      }),
    ]);

    const suggestions = new Set<string>();

    for (const u of users) {
      suggestions.add(u.nombre);
    }

    for (const s of stories) {
      suggestions.add(s.location);
    }

    return Array.from(suggestions).slice(0, limit);
  }
}
