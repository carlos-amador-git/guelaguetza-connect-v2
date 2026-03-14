import React from 'react';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  CheckCircle2,
  Hourglass,
  Loader2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

type StatusSize = 'sm' | 'md' | 'lg';

// ============================================
// BookingStatusBadge Component
// ============================================

interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: StatusSize;
  showLabel?: boolean;
  className?: string;
}

/**
 * BookingStatusBadge - Badge para estados de reservaciones
 *
 * Features:
 * - Estados de booking (PENDING, CONFIRMED, CANCELLED, COMPLETED)
 * - Iconos descriptivos
 * - Colores según estado
 * - Accesible (aria-label)
 *
 * Usage:
 * <BookingStatusBadge status="PENDING" />
 * <BookingStatusBadge status="CONFIRMED" size="lg" />
 */
export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const statusConfig: Record<
    BookingStatus,
    {
      label: string;
      icon: React.ReactNode;
      colors: string;
      bgColors: string;
      ariaLabel: string;
    }
  > = {
    PENDING_PAYMENT: {
      label: 'Procesando',
      icon: <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />,
      colors: 'text-oaxaca-yellow dark:text-oaxaca-yellow',
      bgColors: 'bg-oaxaca-yellow-light dark:bg-oaxaca-yellow/20 border-oaxaca-yellow/30 dark:border-oaxaca-yellow/30',
      ariaLabel: 'Procesando reservacion',
    },
    PAYMENT_FAILED: {
      label: 'Error',
      icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
      colors: 'text-red-700 dark:text-red-400',
      bgColors: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
      ariaLabel: 'Error en la reservacion',
    },
    PENDING: {
      label: 'Pendiente',
      icon: <Hourglass className="w-4 h-4" aria-hidden="true" />,
      colors: 'text-oaxaca-sky dark:text-oaxaca-sky',
      bgColors: 'bg-oaxaca-sky-light dark:bg-oaxaca-sky/20 border-oaxaca-sky/30 dark:border-oaxaca-sky/30',
      ariaLabel: 'Reservación pendiente',
    },
    CONFIRMED: {
      label: 'Confirmado',
      icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
      colors: 'text-green-700 dark:text-green-400',
      bgColors: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
      ariaLabel: 'Reservación confirmada',
    },
    CANCELLED: {
      label: 'Cancelado',
      icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
      colors: 'text-gray-600 dark:text-gray-400',
      bgColors: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      ariaLabel: 'Reservación cancelada',
    },
    COMPLETED: {
      label: 'Completado',
      icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
      colors: 'text-emerald-700 dark:text-emerald-400',
      bgColors: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
      ariaLabel: 'Reservación completada',
    },
  };

  const config = statusConfig[status];

  const sizes: Record<StatusSize, string> = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.colors} ${config.bgColors} ${sizes[size]} ${className}`}
      role="status"
      aria-label={config.ariaLabel}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

// ============================================
// Helper Functions & Constants
// ============================================

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Procesando',
  PAYMENT_FAILED: 'Error',
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
};

/**
 * Determina si un booking puede ser cancelado
 */
export function canCancelBooking(status: BookingStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED';
}

/**
 * Determina si un booking puede ser reintentado (pago fallido)
 */
export function canRetryBookingPayment(status: BookingStatus): boolean {
  return status === 'PAYMENT_FAILED';
}

/**
 * Determina si un booking puede ser reseñado
 */
export function canReviewBooking(status: BookingStatus): boolean {
  return status === 'COMPLETED';
}

// Keep for backward compatibility
export const AlertCircleIcon = AlertCircle;
