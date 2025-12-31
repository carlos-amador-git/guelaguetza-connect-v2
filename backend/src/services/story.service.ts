import { PrismaClient } from '@prisma/client';
import { CreateStoryInput, UpdateStoryInput, PaginationInput, CommentInput } from '../schemas/story.schema.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export class StoryService {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, data: CreateStoryInput) {
    const story = await this.prisma.story.create({
      data: {
        ...data,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return story;
  }

  async list(params: PaginationInput) {
    const { limit, offset, location } = params;

    const where = location ? { location: { contains: location, mode: 'insensitive' as const } } : {};

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.story.count({ where }),
    ]);

    return {
      stories,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getById(id: string, userId?: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!story) {
      throw new NotFoundError('Historia no encontrada');
    }

    // Increment views
    await this.prisma.story.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Check if current user liked this story
    let isLiked = false;
    if (userId) {
      const like = await this.prisma.like.findUnique({
        where: {
          userId_storyId: { userId, storyId: id },
        },
      });
      isLiked = !!like;
    }

    return { ...story, isLiked };
  }

  async update(id: string, userId: string, data: UpdateStoryInput) {
    const story = await this.prisma.story.findUnique({ where: { id } });

    if (!story) {
      throw new NotFoundError('Historia no encontrada');
    }

    if (story.userId !== userId) {
      throw new ForbiddenError('No tienes permiso para editar esta historia');
    }

    return this.prisma.story.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            avatar: true,
          },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    const story = await this.prisma.story.findUnique({ where: { id } });

    if (!story) {
      throw new NotFoundError('Historia no encontrada');
    }

    if (story.userId !== userId) {
      throw new ForbiddenError('No tienes permiso para eliminar esta historia');
    }

    await this.prisma.story.delete({ where: { id } });
    return { success: true };
  }

  async toggleLike(storyId: string, userId: string) {
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_storyId: { userId, storyId },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });
    } else {
      await this.prisma.like.create({
        data: { userId, storyId },
      });
    }

    const totalLikes = await this.prisma.like.count({
      where: { storyId },
    });

    return {
      liked: !existingLike,
      totalLikes,
    };
  }

  async addComment(storyId: string, userId: string, data: CommentInput) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });

    if (!story) {
      throw new NotFoundError('Historia no encontrada');
    }

    const comment = await this.prisma.comment.create({
      data: {
        text: data.text,
        userId,
        storyId,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            avatar: true,
          },
        },
      },
    });

    return comment;
  }
}
