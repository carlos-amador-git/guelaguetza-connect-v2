import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreatePOIInput,
  UpdatePOIInput,
  POIQuery,
  NearbyPOIQuery,
  CreatePOIReviewInput,
} from '../schemas/poi.schema.js';
import { NotFoundError, AppError } from '../utils/errors.js';

export class POIService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // POINTS OF INTEREST
  // ============================================

  async getPOIs(query: POIQuery) {
    const { category, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PointOfInterestWhereInput = {
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [pois, total] = await Promise.all([
      this.prisma.pointOfInterest.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              reviews: true,
              favorites: true,
              checkIns: true,
            },
          },
        },
        orderBy: { rating: 'desc' },
      }),
      this.prisma.pointOfInterest.count({ where }),
    ]);

    return {
      pois,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNearbyPOIs(query: NearbyPOIQuery) {
    const { latitude, longitude, radius, category, limit } = query;

    // Calculate bounding box for initial filtering
    const latDelta = radius / 111; // ~111km per degree of latitude
    const lonDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));

    const where: Prisma.PointOfInterestWhereInput = {
      latitude: {
        gte: latitude - latDelta,
        lte: latitude + latDelta,
      },
      longitude: {
        gte: longitude - lonDelta,
        lte: longitude + lonDelta,
      },
      ...(category && { category }),
    };

    const pois = await this.prisma.pointOfInterest.findMany({
      where,
      include: {
        _count: {
          select: {
            reviews: true,
            favorites: true,
            checkIns: true,
          },
        },
      },
    });

    // Calculate actual distances and filter by radius
    const poisWithDistance = pois
      .map((poi) => ({
        ...poi,
        distance: this.calculateDistance(latitude, longitude, poi.latitude, poi.longitude),
      }))
      .filter((poi) => poi.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return poisWithDistance;
  }

  async getPOIById(id: string, userId?: string) {
    const poi = await this.prisma.pointOfInterest.findUnique({
      where: { id },
      include: {
        reviews: {
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
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            checkIns: true,
          },
        },
      },
    });

    if (!poi) {
      throw new NotFoundError('Punto de interes no encontrado');
    }

    // Check if user has favorited and checked in
    let isFavorite = false;
    let hasCheckedIn = false;

    if (userId) {
      const [favorite, checkIn] = await Promise.all([
        this.prisma.pOIFavorite.findUnique({
          where: { userId_poiId: { userId, poiId: id } },
        }),
        this.prisma.pOICheckIn.findFirst({
          where: { userId, poiId: id },
        }),
      ]);
      isFavorite = !!favorite;
      hasCheckedIn = !!checkIn;
    }

    return { ...poi, isFavorite, hasCheckedIn };
  }

  async createPOI(data: CreatePOIInput) {
    return this.prisma.pointOfInterest.create({
      data,
    });
  }

  async updatePOI(id: string, data: UpdatePOIInput) {
    const poi = await this.prisma.pointOfInterest.findUnique({
      where: { id },
    });

    if (!poi) {
      throw new NotFoundError('Punto de interes no encontrado');
    }

    return this.prisma.pointOfInterest.update({
      where: { id },
      data,
    });
  }

  async deletePOI(id: string) {
    const poi = await this.prisma.pointOfInterest.findUnique({
      where: { id },
    });

    if (!poi) {
      throw new NotFoundError('Punto de interes no encontrado');
    }

    await this.prisma.pointOfInterest.delete({
      where: { id },
    });

    return { message: 'Punto de interes eliminado' };
  }

  // ============================================
  // FAVORITES
  // ============================================

  async toggleFavorite(userId: string, poiId: string) {
    const poi = await this.prisma.pointOfInterest.findUnique({
      where: { id: poiId },
    });

    if (!poi) {
      throw new NotFoundError('Punto de interes no encontrado');
    }

    const existing = await this.prisma.pOIFavorite.findUnique({
      where: { userId_poiId: { userId, poiId } },
    });

    if (existing) {
      await this.prisma.pOIFavorite.delete({
        where: { id: existing.id },
      });
      return { isFavorite: false };
    } else {
      await this.prisma.pOIFavorite.create({
        data: { userId, poiId },
      });
      return { isFavorite: true };
    }
  }

  async getUserFavorites(userId: string) {
    const favorites = await this.prisma.pOIFavorite.findMany({
      where: { userId },
      include: {
        poi: {
          include: {
            _count: {
              select: { reviews: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => f.poi);
  }

  // ============================================
  // CHECK-INS
  // ============================================

  async checkIn(userId: string, poiId: string) {
    const poi = await this.prisma.pointOfInterest.findUnique({
      where: { id: poiId },
    });

    if (!poi) {
      throw new NotFoundError('Punto de interes no encontrado');
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckIn = await this.prisma.pOICheckIn.findFirst({
      where: {
        userId,
        poiId,
        createdAt: { gte: today },
      },
    });

    if (existingCheckIn) {
      throw new AppError('Ya hiciste check-in hoy en este lugar', 400);
    }

    const checkIn = await this.prisma.pOICheckIn.create({
      data: { userId, poiId },
      include: { poi: true },
    });

    // Award XP for check-in (could integrate with gamification)
    // await gamificationService.awardXP(userId, 10, 'poi_checkin');

    return checkIn;
  }

  async getUserCheckIns(userId: string) {
    const checkIns = await this.prisma.pOICheckIn.findMany({
      where: { userId },
      include: { poi: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return checkIns;
  }

  // ============================================
  // REVIEWS
  // ============================================

  async createReview(userId: string, poiId: string, data: CreatePOIReviewInput) {
    const poi = await this.prisma.pointOfInterest.findUnique({
      where: { id: poiId },
    });

    if (!poi) {
      throw new NotFoundError('Punto de interes no encontrado');
    }

    // Check for existing review
    const existingReview = await this.prisma.pOIReview.findUnique({
      where: { userId_poiId: { userId, poiId } },
    });

    if (existingReview) {
      throw new AppError('Ya has resenado este lugar', 400);
    }

    // Create review and update POI rating in transaction
    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.pOIReview.create({
        data: {
          userId,
          poiId,
          rating: data.rating,
          comment: data.comment,
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

      // Calculate new average rating
      const stats = await tx.pOIReview.aggregate({
        where: { poiId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      // Update POI
      await tx.pointOfInterest.update({
        where: { id: poiId },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: stats._count.rating,
        },
      });

      return newReview;
    });

    return review;
  }

  // ============================================
  // HELPERS
  // ============================================

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
