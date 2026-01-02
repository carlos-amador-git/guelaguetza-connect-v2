import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EventCard from './ui/EventCard';
import {
  getEvents,
  Event,
  EventCategory,
  getCategoryLabel,
  getCategoryColor,
  getCategoryIcon,
} from '../services/events';

interface EventsViewProps {
  onBack: () => void;
  onEventDetail: (eventId: string) => void;
}

const CATEGORIES: EventCategory[] = [
  'DANZA',
  'MUSICA',
  'GASTRONOMIA',
  'ARTESANIA',
  'CEREMONIA',
  'DESFILE',
  'OTRO',
];

const EventsView: React.FC<EventsViewProps> = ({
  onBack,
  onEventDetail,
}) => {
  const { token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, selectedMonth, token]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Get start and end of selected month
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      const data = await getEvents(
        {
          category: selectedCategory || undefined,
          startDate,
          endDate,
          limit: 50,
        },
        token || undefined
      );
      setEvents(data.events);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta: number) => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + delta, 1));
  };

  const formatMonth = (date: Date): string => {
    return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.startDate).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, Event[]>);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Eventos</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Guelaguetza 2025</p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full transition-colors ${
              showFilters || selectedCategory
                ? 'bg-oaxaca-pink text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {formatMonth(selectedMonth)}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Category Filters */}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-oaxaca-pink text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                style={
                  selectedCategory === cat
                    ? { backgroundColor: getCategoryColor(cat) }
                    : undefined
                }
              >
                <span>{getCategoryIcon(cat)}</span>
                <span>{getCategoryLabel(cat)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay eventos
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No se encontraron eventos para este mes
              {selectedCategory && ` en la categoría ${getCategoryLabel(selectedCategory)}`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 capitalize">
                  {date}
                </h3>
                <div className="space-y-3">
                  {dateEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => onEventDetail(event.id)}
                      compact
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsView;
