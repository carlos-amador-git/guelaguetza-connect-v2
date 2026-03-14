import { PrismaClient } from '@prisma/client';
import { EventBus } from '../EventBus.js';
import {
  EventTypes,
  DomainEvent,
  BookingConfirmedPayload,
  UserRegisteredPayload,
} from '../types.js';
import { EmailService } from '../../../services/email.service.js';

/**
 * EmailHandler - Sends emails in response to domain events
 */
export class EmailHandler {
  constructor(private prisma: PrismaClient) {}

  register(eventBus: EventBus): void {
    eventBus.on(EventTypes.USER_REGISTERED, this.handleUserRegistered.bind(this));
    eventBus.on(EventTypes.BOOKING_CONFIRMED, this.handleBookingConfirmed.bind(this));
  }

  private async handleUserRegistered(event: DomainEvent<UserRegisteredPayload>): Promise<void> {
    const { email, nombre } = event.payload;
    await EmailService.sendWelcome(email, nombre);
  }

  private async handleBookingConfirmed(event: DomainEvent<BookingConfirmedPayload>): Promise<void> {
    const { userId, userName, experienceTitle, guestCount, totalPrice, timeSlot } = event.payload;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user) {
      await EmailService.sendBookingConfirmed(user.email, {
        userName,
        experienceTitle,
        date: timeSlot.date,
        startTime: timeSlot.startTime,
        guestCount,
        totalPrice,
      });
    }
  }
}
