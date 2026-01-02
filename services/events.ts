// Events Service - API calls

const API_BASE = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3000/api';

export type EventCategory =
  | 'DANZA'
  | 'MUSICA'
  | 'GASTRONOMIA'
  | 'ARTESANIA'
  | 'CEREMONIA'
  | 'DESFILE'
  | 'OTRO';

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string | null;
  category: EventCategory;
  isOfficial: boolean;
  rsvpCount: number;
  hasRSVP?: boolean;
  hasReminder?: boolean;
}

export interface EventDetail extends Event {
  createdAt: string;
  updatedAt: string;
}

export interface EventsResponse {
  events: Event[];
  hasMore: boolean;
  total: number;
}

export interface MyRSVPsResponse {
  events: Event[];
  total: number;
}

// Get events with filters
export async function getEvents(
  options: {
    category?: EventCategory;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {},
  token?: string
): Promise<EventsResponse> {
  const { category, startDate, endDate, page = 1, limit = 20 } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (category) params.append('category', category);
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/events?${params}`, { headers });

  if (!response.ok) {
    throw new Error('Error al obtener eventos');
  }

  const data = await response.json();
  return data.data;
}

// Get single event
export async function getEvent(eventId: string, token?: string): Promise<EventDetail> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/events/${eventId}`, { headers });

  if (!response.ok) {
    throw new Error('Evento no encontrado');
  }

  const data = await response.json();
  return data.data;
}

// Create RSVP
export async function createRSVP(eventId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al confirmar asistencia');
  }
}

// Delete RSVP
export async function deleteRSVP(eventId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al cancelar asistencia');
  }
}

// Create reminder
export async function createReminder(
  eventId: string,
  remindAt: Date,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${eventId}/reminder`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ remindAt: remindAt.toISOString() }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear recordatorio');
  }
}

// Delete reminder
export async function deleteReminder(eventId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${eventId}/reminder`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al eliminar recordatorio');
  }
}

// Get user's RSVPd events
export async function getMyRSVPs(token: string): Promise<MyRSVPsResponse> {
  const response = await fetch(`${API_BASE}/events/my-rsvps`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener mis eventos');
  }

  const data = await response.json();
  return data.data;
}

// Format event date
export function formatEventDate(date: string): string {
  return new Date(date).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// Format event time
export function formatEventTime(date: string): string {
  return new Date(date).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Get category label
export function getCategoryLabel(category: EventCategory): string {
  const labels: Record<EventCategory, string> = {
    DANZA: 'Danza',
    MUSICA: 'Música',
    GASTRONOMIA: 'Gastronomía',
    ARTESANIA: 'Artesanía',
    CEREMONIA: 'Ceremonia',
    DESFILE: 'Desfile',
    OTRO: 'Otro',
  };
  return labels[category] || category;
}

// Get category color
export function getCategoryColor(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    DANZA: '#E91E63',
    MUSICA: '#9C27B0',
    GASTRONOMIA: '#FF9800',
    ARTESANIA: '#4CAF50',
    CEREMONIA: '#3F51B5',
    DESFILE: '#F44336',
    OTRO: '#607D8B',
  };
  return colors[category] || '#607D8B';
}

// Get category icon
export function getCategoryIcon(category: EventCategory): string {
  const icons: Record<EventCategory, string> = {
    DANZA: '💃',
    MUSICA: '🎵',
    GASTRONOMIA: '🍽️',
    ARTESANIA: '🎨',
    CEREMONIA: '🎭',
    DESFILE: '🎪',
    OTRO: '📅',
  };
  return icons[category] || '📅';
}
