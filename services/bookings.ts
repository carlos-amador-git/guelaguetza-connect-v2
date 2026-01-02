import { api } from './api';

// Types
export type ExperienceCategory = 'TOUR' | 'TALLER' | 'DEGUSTACION' | 'CLASE' | 'VISITA';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Experience {
  id: string;
  hostId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  images: string[];
  category: ExperienceCategory;
  price: string;
  duration: number;
  maxCapacity: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  includes: string[];
  languages: string[];
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  host: {
    id: string;
    nombre: string;
    apellido: string;
    avatar: string | null;
  };
  _count?: {
    reviews: number;
    bookings: number;
  };
}

export interface TimeSlot {
  id: string;
  experienceId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  isAvailable: boolean;
  availableSpots?: number;
}

export interface Booking {
  id: string;
  userId: string;
  experienceId: string;
  timeSlotId: string;
  status: BookingStatus;
  guestCount: number;
  totalPrice: string;
  specialRequests: string | null;
  stripePaymentId: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  experience: Experience;
  timeSlot: TimeSlot;
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    avatar?: string;
  };
}

export interface ExperienceReview {
  id: string;
  userId: string;
  experienceId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    avatar: string | null;
  };
}

export interface ExperienceQuery {
  category?: ExperienceCategory;
  minPrice?: number;
  maxPrice?: number;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BookingQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface CreateBookingInput {
  experienceId: string;
  timeSlotId: string;
  guestCount: number;
  specialRequests?: string;
}

export interface CreateExperienceInput {
  title: string;
  description: string;
  imageUrl?: string;
  images?: string[];
  category: ExperienceCategory;
  price: number;
  duration: number;
  maxCapacity: number;
  location: string;
  latitude?: number;
  longitude?: number;
  includes?: string[];
  languages?: string[];
}

// API Functions
export async function getExperiences(query: ExperienceQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });

  const response = await api.get<{
    experiences: Experience[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/bookings/experiences?${params}`);
  return response;
}

export async function getExperience(id: string) {
  const response = await api.get<Experience & { reviews: ExperienceReview[] }>(`/bookings/experiences/${id}`);
  return response;
}

export async function createExperience(data: CreateExperienceInput) {
  const response = await api.post<Experience>('/bookings/experiences', data);
  return response;
}

export async function updateExperience(id: string, data: Partial<CreateExperienceInput>) {
  const response = await api.put<Experience>(`/bookings/experiences/${id}`, data);
  return response;
}

export async function deleteExperience(id: string) {
  const response = await api.delete<{ message: string }>(`/bookings/experiences/${id}`);
  return response;
}

// Time Slots
export async function getTimeSlots(experienceId: string, startDate: string, endDate?: string) {
  const params = new URLSearchParams({ startDate });
  if (endDate) params.append('endDate', endDate);

  const response = await api.get<TimeSlot[]>(`/bookings/experiences/${experienceId}/slots?${params}`);
  return response;
}

export async function createTimeSlots(experienceId: string, slots: Array<{
  date: string;
  startTime: string;
  endTime: string;
  capacity?: number;
}>) {
  const response = await api.post<{ created: number }>(`/bookings/experiences/${experienceId}/slots`, { slots });
  return response;
}

export async function deleteTimeSlot(slotId: string) {
  const response = await api.delete<{ message: string }>(`/bookings/slots/${slotId}`);
  return response;
}

// Bookings
export async function getMyBookings(query: BookingQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });

  const response = await api.get<{
    bookings: Booking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/bookings/bookings?${params}`);
  return response;
}

export async function getBooking(id: string) {
  const response = await api.get<Booking>(`/bookings/bookings/${id}`);
  return response;
}

export async function createBooking(data: CreateBookingInput) {
  const response = await api.post<{
    booking: Booking;
    clientSecret: string | null;
  }>('/bookings/bookings', data);
  return response;
}

export async function confirmBooking(id: string) {
  const response = await api.post<Booking>(`/bookings/bookings/${id}/confirm`, {});
  return response;
}

export async function cancelBooking(id: string) {
  const response = await api.post<Booking>(`/bookings/bookings/${id}/cancel`, {});
  return response;
}

export async function completeBooking(id: string) {
  const response = await api.post<Booking>(`/bookings/bookings/${id}/complete`, {});
  return response;
}

// Reviews
export async function createExperienceReview(experienceId: string, data: { rating: number; comment?: string }) {
  const response = await api.post<ExperienceReview>(`/bookings/experiences/${experienceId}/reviews`, data);
  return response;
}

// Host Functions
export async function getHostExperiences() {
  const response = await api.get<Experience[]>('/bookings/host/experiences');
  return response;
}

export async function getHostBookings(query: BookingQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });

  const response = await api.get<{
    bookings: Booking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/bookings/host/bookings?${params}`);
  return response;
}

// Helpers
export const CATEGORY_LABELS: Record<ExperienceCategory, string> = {
  TOUR: 'Tour',
  TALLER: 'Taller',
  DEGUSTACION: 'Degustacion',
  CLASE: 'Clase',
  VISITA: 'Visita',
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'yellow',
  CONFIRMED: 'green',
  CANCELLED: 'red',
  COMPLETED: 'blue',
};

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(numPrice);
}
