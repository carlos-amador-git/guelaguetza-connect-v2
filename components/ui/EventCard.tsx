import React from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import {
  Event,
  formatEventDate,
  formatEventTime,
  getCategoryLabel,
  getCategoryColor,
  getCategoryIcon,
} from '../../services/events';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  compact?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  compact = false,
}) => {
  const categoryColor = getCategoryColor(event.category);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all text-left"
      >
        {/* Date badge */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white"
          style={{ backgroundColor: categoryColor }}
        >
          <span className="text-xs font-medium">
            {new Date(event.startDate).toLocaleDateString('es-MX', { month: 'short' }).toUpperCase()}
          </span>
          <span className="text-lg font-bold leading-none">
            {new Date(event.startDate).getDate()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{event.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <Clock size={12} />
            {formatEventTime(event.startDate)}
          </p>
        </div>

        {/* RSVP count */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Users size={14} />
          <span>{event.rsvpCount}</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden text-left"
    >
      {/* Image */}
      {event.imageUrl ? (
        <div className="relative h-40 w-full">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* Category badge */}
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-medium"
            style={{ backgroundColor: categoryColor }}
          >
            {getCategoryIcon(event.category)} {getCategoryLabel(event.category)}
          </div>
          {/* Official badge */}
          {event.isOfficial && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-oaxaca-pink text-white text-xs font-medium rounded-full">
              Oficial
            </div>
          )}
        </div>
      ) : (
        <div
          className="relative h-32 w-full flex items-center justify-center text-4xl"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          {getCategoryIcon(event.category)}
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-medium"
            style={{ backgroundColor: categoryColor }}
          >
            {getCategoryLabel(event.category)}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">
          {event.title}
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
          {event.description}
        </p>

        <div className="mt-4 space-y-2">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar size={16} className="text-oaxaca-pink" />
            <span>{formatEventDate(event.startDate)}</span>
            <span className="text-gray-400">|</span>
            <Clock size={16} className="text-oaxaca-pink" />
            <span>{formatEventTime(event.startDate)}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <MapPin size={16} className="text-oaxaca-pink" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Users size={16} />
            <span>{event.rsvpCount} asistirán</span>
          </div>

          {event.hasRSVP && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
              Confirmado
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default EventCard;
