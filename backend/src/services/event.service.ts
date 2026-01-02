import { PrismaClient, EventCategory, Event as PrismaEvent } from '@prisma/client';
import { NotificationService } from './notification.service.js';

interface EventsInput {
  category?: EventCategory;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

interface EventResponse {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  startDate: Date;
  endDate: Date | null;
  category: EventCategory;
  isOfficial: boolean;
  rsvpCount: number;
  hasRSVP?: boolean;
  hasReminder?: boolean;
}

interface EventDetailResponse extends EventResponse {
  createdAt: Date;
  updatedAt: Date;
}

export class EventService {
  constructor(
    private prisma: PrismaClient,
    private notificationService?: NotificationService
  ) {}

  // Get events with filters
  async getEvents(
    input: EventsInput,
    userId?: string
  ): Promise<{ events: EventResponse[]; hasMore: boolean; total: number }> {
    const { category, startDate, endDate, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (startDate) {
      where.startDate = { gte: startDate };
    }

    if (endDate) {
      where.startDate = { ...(where.startDate as object || {}), lte: endDate };
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          _count: {
            select: { rsvps: true },
          },
          rsvps: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
          reminders: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: limit + 1,
      }),
      this.prisma.event.count({ where }),
    ]);

    const hasMore = events.length > limit;
    const eventsResult = hasMore ? events.slice(0, limit) : events;

    return {
      events: eventsResult.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        imageUrl: e.imageUrl,
        location: e.location,
        latitude: e.latitude,
        longitude: e.longitude,
        startDate: e.startDate,
        endDate: e.endDate,
        category: e.category,
        isOfficial: e.isOfficial,
        rsvpCount: e._count.rsvps,
        hasRSVP: userId ? (e.rsvps as { id: string }[]).length > 0 : undefined,
        hasReminder: userId ? (e.reminders as { id: string }[]).length > 0 : undefined,
      })),
      hasMore,
      total,
    };
  }

  // Get single event
  async getEvent(eventId: string, userId?: string): Promise<EventDetailResponse | null> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { rsvps: true },
        },
        rsvps: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
        reminders: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!event) return null;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      startDate: event.startDate,
      endDate: event.endDate,
      category: event.category,
      isOfficial: event.isOfficial,
      rsvpCount: event._count.rsvps,
      hasRSVP: userId ? (event.rsvps as { id: string }[]).length > 0 : undefined,
      hasReminder: userId ? (event.reminders as { id: string }[]).length > 0 : undefined,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  // Create RSVP
  async createRSVP(userId: string, eventId: string): Promise<void> {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Create RSVP (will throw if already exists due to unique constraint)
    await this.prisma.eventRSVP.create({
      data: { userId, eventId },
    });
  }

  // Delete RSVP
  async deleteRSVP(userId: string, eventId: string): Promise<void> {
    await this.prisma.eventRSVP.deleteMany({
      where: { userId, eventId },
    });
  }

  // Create reminder
  async createReminder(userId: string, eventId: string, remindAt: Date): Promise<void> {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Validate remindAt is before event start
    if (remindAt >= event.startDate) {
      throw new Error('El recordatorio debe ser antes del evento');
    }

    // Upsert reminder
    await this.prisma.eventReminder.upsert({
      where: {
        userId_eventId: { userId, eventId },
      },
      create: { userId, eventId, remindAt },
      update: { remindAt, sent: false },
    });
  }

  // Delete reminder
  async deleteReminder(userId: string, eventId: string): Promise<void> {
    await this.prisma.eventReminder.deleteMany({
      where: { userId, eventId },
    });
  }

  // Get user's RSVPd events
  async getMyRSVPs(userId: string): Promise<{ events: EventResponse[]; total: number }> {
    const rsvps = await this.prisma.eventRSVP.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            _count: {
              select: { rsvps: true },
            },
            reminders: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { event: { startDate: 'asc' } },
    });

    return {
      events: rsvps.map((r) => ({
        id: r.event.id,
        title: r.event.title,
        description: r.event.description,
        imageUrl: r.event.imageUrl,
        location: r.event.location,
        latitude: r.event.latitude,
        longitude: r.event.longitude,
        startDate: r.event.startDate,
        endDate: r.event.endDate,
        category: r.event.category,
        isOfficial: r.event.isOfficial,
        rsvpCount: r.event._count.rsvps,
        hasRSVP: true,
        hasReminder: r.event.reminders.length > 0,
      })),
      total: rsvps.length,
    };
  }

  // Process pending reminders (called by cron job)
  async processPendingReminders(): Promise<void> {
    const now = new Date();

    const pendingReminders = await this.prisma.eventReminder.findMany({
      where: {
        remindAt: { lte: now },
        sent: false,
      },
      include: {
        event: true,
        user: { select: { id: true } },
      },
    });

    for (const reminder of pendingReminders) {
      if (this.notificationService) {
        await this.notificationService.create(reminder.userId, {
          type: 'EVENT_REMINDER',
          title: 'Recordatorio de evento',
          body: `${reminder.event.title} comienza pronto`,
          data: { eventId: reminder.eventId },
        });
      }

      // Mark as sent
      await this.prisma.eventReminder.update({
        where: { id: reminder.id },
        data: { sent: true },
      });
    }
  }
}
