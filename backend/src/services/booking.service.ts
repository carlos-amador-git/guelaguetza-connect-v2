import { PrismaClient, BookingStatus, Prisma } from '@prisma/client';
import {
  CreateExperienceInput,
  UpdateExperienceInput,
  CreateTimeSlotInput,
  CreateBookingInput,
  ExperienceQuery,
  TimeSlotQuery,
  BookingQuery,
  CreateExperienceReviewInput,
} from '../schemas/booking.schema.js';
import { stripeService } from './stripe.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';

export class BookingService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // EXPERIENCES
  // ============================================

  async getExperiences(query: ExperienceQuery) {
    const { category, minPrice, maxPrice, date, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExperienceWhereInput = {
      isActive: true,
      ...(category && { category }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(date && {
        timeSlots: {
          some: {
            date: new Date(date),
            isAvailable: true,
          },
        },
      }),
    };

    const [experiences, total] = await Promise.all([
      this.prisma.experience.findMany({
        where,
        skip,
        take: limit,
        include: {
          host: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.experience.count({ where }),
    ]);

    return {
      experiences,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getExperienceById(id: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            avatar: true,
          },
        },
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
            bookings: true,
          },
        },
      },
    });

    if (!experience) {
      throw new NotFoundError('Experiencia no encontrada');
    }

    return experience;
  }

  async createExperience(hostId: string, data: CreateExperienceInput) {
    return this.prisma.experience.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price),
        hostId,
      },
      include: {
        host: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateExperience(id: string, hostId: string, data: UpdateExperienceInput) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
    });

    if (!experience) {
      throw new NotFoundError('Experiencia no encontrada');
    }

    if (experience.hostId !== hostId) {
      throw new AppError('No tienes permiso para editar esta experiencia', 403);
    }

    return this.prisma.experience.update({
      where: { id },
      data: {
        ...data,
        ...(data.price && { price: new Prisma.Decimal(data.price) }),
      },
    });
  }

  async deleteExperience(id: string, hostId: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
    });

    if (!experience) {
      throw new NotFoundError('Experiencia no encontrada');
    }

    if (experience.hostId !== hostId) {
      throw new AppError('No tienes permiso para eliminar esta experiencia', 403);
    }

    // Soft delete by deactivating
    await this.prisma.experience.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Experiencia eliminada' };
  }

  // ============================================
  // TIME SLOTS
  // ============================================

  async getTimeSlots(experienceId: string, query: TimeSlotQuery) {
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience) {
      throw new NotFoundError('Experiencia no encontrada');
    }

    const startDate = new Date(query.startDate);
    const endDate = query.endDate ? new Date(query.endDate) : startDate;

    const slots = await this.prisma.experienceTimeSlot.findMany({
      where: {
        experienceId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        isAvailable: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return slots.map((slot) => ({
      ...slot,
      availableSpots: slot.capacity - slot.bookedCount,
    }));
  }

  async createTimeSlots(experienceId: string, hostId: string, slots: CreateTimeSlotInput[]) {
    const experience = await this.prisma.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience) {
      throw new NotFoundError('Experiencia no encontrada');
    }

    if (experience.hostId !== hostId) {
      throw new AppError('No tienes permiso para crear horarios', 403);
    }

    const createdSlots = await this.prisma.experienceTimeSlot.createMany({
      data: slots.map((slot) => ({
        experienceId,
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity || experience.maxCapacity,
      })),
    });

    return { created: createdSlots.count };
  }

  async deleteTimeSlot(slotId: string, hostId: string) {
    const slot = await this.prisma.experienceTimeSlot.findUnique({
      where: { id: slotId },
      include: { experience: true },
    });

    if (!slot) {
      throw new NotFoundError('Horario no encontrado');
    }

    if (slot.experience.hostId !== hostId) {
      throw new AppError('No tienes permiso para eliminar este horario', 403);
    }

    if (slot.bookedCount > 0) {
      throw new AppError('No puedes eliminar un horario con reservaciones', 400);
    }

    await this.prisma.experienceTimeSlot.delete({
      where: { id: slotId },
    });

    return { message: 'Horario eliminado' };
  }

  // ============================================
  // BOOKINGS
  // ============================================

  async getMyBookings(userId: string, query: BookingQuery) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      userId,
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          experience: {
            include: {
              host: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  avatar: true,
                },
              },
            },
          },
          timeSlot: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBookingById(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        experience: {
          include: {
            host: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                avatar: true,
              },
            },
          },
        },
        timeSlot: true,
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError('Reservación no encontrada');
    }

    // User can see their own booking, host can see bookings for their experiences
    if (booking.userId !== userId && booking.experience.hostId !== userId) {
      throw new AppError('No tienes permiso para ver esta reservación', 403);
    }

    return booking;
  }

  async createBooking(userId: string, data: CreateBookingInput) {
    const { experienceId, timeSlotId, guestCount, specialRequests } = data;

    // Get experience and slot in parallel
    const [experience, timeSlot] = await Promise.all([
      this.prisma.experience.findUnique({ where: { id: experienceId } }),
      this.prisma.experienceTimeSlot.findUnique({ where: { id: timeSlotId } }),
    ]);

    if (!experience) {
      throw new NotFoundError('Experiencia no encontrada');
    }

    if (!timeSlot) {
      throw new NotFoundError('Horario no encontrado');
    }

    if (timeSlot.experienceId !== experienceId) {
      throw new AppError('El horario no corresponde a esta experiencia', 400);
    }

    if (!timeSlot.isAvailable) {
      throw new AppError('Este horario ya no está disponible', 400);
    }

    const availableSpots = timeSlot.capacity - timeSlot.bookedCount;
    if (guestCount > availableSpots) {
      throw new AppError(`Solo hay ${availableSpots} lugares disponibles`, 400);
    }

    // Calculate total price
    const totalPrice = Number(experience.price) * guestCount;

    // Create payment intent
    const payment = await stripeService.createPaymentIntent({
      amount: Math.round(totalPrice * 100), // Convert to cents
      description: `Reservación: ${experience.title}`,
      metadata: {
        experienceId,
        timeSlotId,
        userId,
        guestCount: String(guestCount),
      },
    });

    // Create booking and update slot count in transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      // Update slot booked count
      await tx.experienceTimeSlot.update({
        where: { id: timeSlotId },
        data: {
          bookedCount: { increment: guestCount },
          isAvailable: timeSlot.bookedCount + guestCount < timeSlot.capacity,
        },
      });

      // Create booking
      return tx.booking.create({
        data: {
          userId,
          experienceId,
          timeSlotId,
          guestCount,
          totalPrice: new Prisma.Decimal(totalPrice),
          specialRequests,
          stripePaymentId: payment?.paymentIntentId,
        },
        include: {
          experience: true,
          timeSlot: true,
        },
      });
    });

    return {
      booking,
      clientSecret: payment?.clientSecret,
    };
  }

  async confirmBooking(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { experience: true },
    });

    if (!booking) {
      throw new NotFoundError('Reservación no encontrada');
    }

    if (booking.userId !== userId) {
      throw new AppError('No tienes permiso para confirmar esta reservación', 403);
    }

    if (booking.status !== 'PENDING') {
      throw new AppError('Esta reservación ya fue procesada', 400);
    }

    // Verify payment if Stripe is enabled
    if (booking.stripePaymentId && stripeService.isEnabled()) {
      const status = await stripeService.getPaymentStatus(booking.stripePaymentId);
      if (status !== 'succeeded') {
        throw new AppError('El pago no ha sido completado', 400);
      }
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        experience: true,
        timeSlot: true,
      },
    });
  }

  async cancelBooking(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { experience: true, timeSlot: true },
    });

    if (!booking) {
      throw new NotFoundError('Reservación no encontrada');
    }

    // User or host can cancel
    if (booking.userId !== userId && booking.experience.hostId !== userId) {
      throw new AppError('No tienes permiso para cancelar esta reservación', 403);
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError('Esta reservación ya fue cancelada', 400);
    }

    if (booking.status === 'COMPLETED') {
      throw new AppError('No puedes cancelar una reservación completada', 400);
    }

    // Refund payment if confirmed
    if (booking.status === 'CONFIRMED' && booking.stripePaymentId) {
      await stripeService.createRefund(booking.stripePaymentId);
    }

    // Cancel and restore slot capacity in transaction
    return this.prisma.$transaction(async (tx) => {
      // Restore slot capacity
      await tx.experienceTimeSlot.update({
        where: { id: booking.timeSlotId },
        data: {
          bookedCount: { decrement: booking.guestCount },
          isAvailable: true,
        },
      });

      // Update booking status
      return tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        include: {
          experience: true,
          timeSlot: true,
        },
      });
    });
  }

  // Host marks booking as completed
  async completeBooking(id: string, hostId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { experience: true },
    });

    if (!booking) {
      throw new NotFoundError('Reservación no encontrada');
    }

    if (booking.experience.hostId !== hostId) {
      throw new AppError('No tienes permiso para completar esta reservación', 403);
    }

    if (booking.status !== 'CONFIRMED') {
      throw new AppError('Solo puedes completar reservaciones confirmadas', 400);
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        experience: true,
        timeSlot: true,
      },
    });
  }

  // ============================================
  // REVIEWS
  // ============================================

  async createReview(userId: string, experienceId: string, data: CreateExperienceReviewInput) {
    // Check if user has a completed booking for this experience
    const completedBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        experienceId,
        status: 'COMPLETED',
      },
    });

    if (!completedBooking) {
      throw new AppError('Solo puedes reseñar experiencias que hayas completado', 403);
    }

    // Check for existing review
    const existingReview = await this.prisma.experienceReview.findUnique({
      where: {
        userId_experienceId: { userId, experienceId },
      },
    });

    if (existingReview) {
      throw new AppError('Ya has reseñado esta experiencia', 400);
    }

    // Create review and update experience rating in transaction
    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.experienceReview.create({
        data: {
          userId,
          experienceId,
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
      const stats = await tx.experienceReview.aggregate({
        where: { experienceId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      // Update experience
      await tx.experience.update({
        where: { id: experienceId },
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
  // HOST DASHBOARD
  // ============================================

  async getHostExperiences(hostId: string) {
    return this.prisma.experience.findMany({
      where: { hostId },
      include: {
        _count: {
          select: {
            bookings: true,
            reviews: true,
            timeSlots: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHostBookings(hostId: string, query: BookingQuery) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      experience: { hostId },
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          experience: true,
          timeSlot: true,
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
