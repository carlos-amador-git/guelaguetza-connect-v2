import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  MapPin,
  Clock,
  Star,
  Users,
  Check,
  Calendar,
  Globe,
  MessageSquare,
  Share2,
  Heart,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';
import {
  getExperience,
  getTimeSlots,
  createBooking,
  confirmBooking,
  Experience,
  ExperienceReview,
  TimeSlot,
  CATEGORY_LABELS,
  formatDuration,
  formatPrice,
} from '../services/bookings';
import { ViewState } from '../types';

interface ExperienceDetailViewProps {
  experienceId: string;
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

export default function ExperienceDetailView({
  experienceId,
  onNavigate,
  onBack,
}: ExperienceDetailViewProps) {
  const [experience, setExperience] = useState<(Experience & { reviews: ExperienceReview[] }) | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  useEffect(() => {
    loadExperience();
  }, [experienceId]);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate]);

  const loadExperience = async () => {
    try {
      setLoading(true);
      const data = await getExperience(experienceId);
      setExperience(data);
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error loading experience:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlots = async () => {
    try {
      const slots = await getTimeSlots(experienceId, selectedDate);
      setTimeSlots(slots);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error loading time slots:', error);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;

    try {
      setBookingLoading(true);
      const result = await createBooking({
        experienceId,
        timeSlotId: selectedSlot.id,
        guestCount,
        specialRequests: specialRequests || undefined,
      });

      // For now, auto-confirm (in production, would use Stripe)
      await confirmBooking(result.booking.id);

      // Navigate to bookings
      onNavigate(ViewState.MY_BOOKINGS);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error al crear la reservacion');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: experience?.title,
        text: experience?.description,
        url: window.location.href,
      });
    } catch {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading || !experience) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Cargando experiencia..." />
      </div>
    );
  }

  const totalPrice = parseFloat(experience.price) * guestCount;
  const availableSlots = timeSlots.filter((s) => (s.availableSpots || 0) >= guestCount);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Image */}
      <div className="relative h-64">
        <img
          src={experience.imageUrl || `https://picsum.photos/800/400?random=${experienceId}`}
          alt={experience.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between">
          <button onClick={onBack} className="p-2 bg-black/30 backdrop-blur-sm rounded-full">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex gap-2">
            <button className="p-2 bg-black/30 backdrop-blur-sm rounded-full">
              <Heart className="w-6 h-6 text-white" />
            </button>
            <button onClick={handleShare} className="p-2 bg-black/30 backdrop-blur-sm rounded-full">
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Category badge */}
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
            {CATEGORY_LABELS[experience.category]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Title & Price */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{experience.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                {experience.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{experience.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({experience.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{formatPrice(experience.price)}</p>
              <p className="text-sm text-gray-500">por persona</p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 py-4 border-y">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>{formatDuration(experience.duration)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>Max {experience.maxCapacity}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Globe className="w-5 h-5" />
              <span>{experience.languages.join(', ')}</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 py-4 border-b">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{experience.location}</p>
              {experience.latitude && experience.longitude && (
                <button className="text-purple-600 text-sm flex items-center gap-1 mt-1">
                  Ver en mapa
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Host */}
          <div className="flex items-center gap-3 py-4 border-b">
            <img
              src={experience.host.avatar || '/default-avatar.png'}
              alt={experience.host.nombre}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {experience.host.nombre} {experience.host.apellido}
              </p>
              <p className="text-sm text-gray-500">Anfitrion</p>
            </div>
            <button className="p-2 border rounded-full">
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b mt-4">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Informacion
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              Resenas ({experience.reviewCount})
            </button>
          </div>

          {activeTab === 'info' ? (
            <>
              {/* Description */}
              <div className="py-4">
                <h3 className="font-semibold text-gray-900 mb-2">Descripcion</h3>
                <p className="text-gray-600 whitespace-pre-line">{experience.description}</p>
              </div>

              {/* Includes */}
              {experience.includes.length > 0 && (
                <div className="py-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">Que incluye</h3>
                  <div className="space-y-2">
                    {experience.includes.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-4">
              {experience.reviews.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aun no hay resenas</p>
              ) : (
                <div className="space-y-4">
                  {experience.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={review.user.avatar || '/default-avatar.png'}
                          alt={review.user.nombre}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{review.user.nombre}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-gray-600">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Bar */}
      <div className="border-t bg-white p-4">
        <button
          onClick={() => setShowBooking(true)}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium"
        >
          Reservar ahora
        </button>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Reservar experiencia</h2>
                <button onClick={() => setShowBooking(false)} className="p-2">
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Horario disponible
                </label>
                {availableSlots.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hay horarios disponibles para esta fecha
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          selectedSlot?.id === slot.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'hover:border-gray-400'
                        }`}
                      >
                        <p className="font-medium">{slot.startTime}</p>
                        <p className="text-xs text-gray-500">
                          {slot.availableSpots} lugares
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Numero de personas
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    className="p-2 border rounded-full"
                    disabled={guestCount <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{guestCount}</span>
                  <button
                    onClick={() =>
                      setGuestCount(
                        Math.min(
                          selectedSlot?.availableSpots || experience.maxCapacity,
                          guestCount + 1
                        )
                      )
                    }
                    className="p-2 border rounded-full"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solicitudes especiales (opcional)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Alergias, restricciones, etc."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">
                    {formatPrice(experience.price)} x {guestCount} personas
                  </span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-purple-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleBook}
                disabled={!selectedSlot || bookingLoading}
                className="w-full py-4 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {bookingLoading ? 'Procesando...' : 'Confirmar reservacion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
