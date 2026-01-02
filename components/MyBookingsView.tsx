import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
} from 'lucide-react';
import {
  getMyBookings,
  cancelBooking,
  createExperienceReview,
  Booking,
  BookingStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  formatDuration,
  formatPrice,
} from '../services/bookings';
import { ViewState } from '../types';

interface MyBookingsViewProps {
  onNavigate: (view: ViewState, data?: unknown) => void;
  onBack: () => void;
}

type TabStatus = 'all' | BookingStatus;

export default function MyBookingsView({ onNavigate, onBack }: MyBookingsViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const result = await getMyBookings({
        status: activeTab === 'all' ? undefined : activeTab,
        limit: 50,
      });
      setBookings(result.bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!confirm('Estas seguro de cancelar esta reservacion?')) return;

    try {
      await cancelBooking(booking.id);
      loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error al cancelar la reservacion');
    }
  };

  const handleReview = async () => {
    if (!selectedBooking) return;

    try {
      setReviewLoading(true);
      await createExperienceReview(selectedBooking.experienceId, {
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      setShowReviewModal(false);
      setSelectedBooking(null);
      setReviewRating(5);
      setReviewComment('');
      alert('Resena enviada!');
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Error al enviar la resena');
    } finally {
      setReviewLoading(false);
    }
  };

  const tabs: { key: TabStatus; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'PENDING', label: 'Pendientes' },
    { key: 'CONFIRMED', label: 'Confirmadas' },
    { key: 'COMPLETED', label: 'Completadas' },
    { key: 'CANCELLED', label: 'Canceladas' },
  ];

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-4 pt-12">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Mis Reservaciones</h1>
            <p className="text-sm text-white/80">{bookings.length} reservaciones</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'bg-white text-purple-600' : 'bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No tienes reservaciones</p>
            <button
              onClick={() => onNavigate(ViewState.EXPERIENCES)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              Explorar experiencias
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={() => handleCancel(booking)}
                onReview={() => {
                  setSelectedBooking(booking);
                  setShowReviewModal(true);
                }}
                onClick={() => onNavigate(ViewState.EXPERIENCE_DETAIL, { experienceId: booking.experienceId })}
                statusIcon={getStatusIcon(booking.status)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Deja tu resena</h2>
            <p className="text-gray-600 mb-4">{selectedBooking.experience.title}</p>

            {/* Rating */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)}>
                  <Star
                    className={`w-10 h-10 ${
                      star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Cuentanos tu experiencia (opcional)"
              className="w-full p-3 border rounded-lg resize-none mb-4"
              rows={4}
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 border rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleReview}
                disabled={reviewLoading}
                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {reviewLoading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  onCancel: () => void;
  onReview: () => void;
  onClick: () => void;
  statusIcon: React.ReactNode;
}

function BookingCard({ booking, onCancel, onReview, onClick, statusIcon }: BookingCardProps) {
  const experience = booking.experience;
  const slot = booking.timeSlot;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Image & Status */}
      <div className="relative h-32" onClick={onClick}>
        <img
          src={experience.imageUrl || `https://picsum.photos/400/200?random=${experience.id}`}
          alt={experience.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
          {statusIcon}
          <span className="text-sm font-medium">{STATUS_LABELS[booking.status]}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{experience.title}</h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(slot.date).toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {slot.startTime} - {slot.endTime} ({formatDuration(experience.duration)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              {booking.guestCount} {booking.guestCount === 1 ? 'persona' : 'personas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{experience.location}</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="text-gray-600">Total pagado</span>
          <span className="text-lg font-bold text-purple-600">{formatPrice(booking.totalPrice)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="flex-1 py-2 border border-red-500 text-red-500 rounded-lg font-medium"
            >
              Cancelar
            </button>
          ) : booking.status === 'COMPLETED' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview();
              }}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" />
              Dejar resena
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
