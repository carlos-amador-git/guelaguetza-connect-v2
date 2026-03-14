import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  BookingStatusBadge,
  canCancelBooking,
  canReviewBooking,
  BOOKING_STATUS_LABELS,
} from './StatusBadge';

describe('BookingStatusBadge', () => {
  it('muestra el badge de PENDING correctamente', () => {
    render(<BookingStatusBadge status="PENDING" />);
    expect(screen.getByRole('status')).toHaveTextContent('Pendiente');
    expect(screen.getByLabelText('Reservación pendiente')).toBeInTheDocument();
  });

  it('muestra el badge de CONFIRMED correctamente', () => {
    render(<BookingStatusBadge status="CONFIRMED" />);
    expect(screen.getByRole('status')).toHaveTextContent('Confirmado');
    expect(screen.getByLabelText('Reservación confirmada')).toBeInTheDocument();
  });

  it('muestra el badge de CANCELLED correctamente', () => {
    render(<BookingStatusBadge status="CANCELLED" />);
    expect(screen.getByRole('status')).toHaveTextContent('Cancelado');
    expect(screen.getByLabelText('Reservación cancelada')).toBeInTheDocument();
  });

  it('muestra el badge de COMPLETED correctamente', () => {
    render(<BookingStatusBadge status="COMPLETED" />);
    expect(screen.getByRole('status')).toHaveTextContent('Completado');
    expect(screen.getByLabelText('Reservación completada')).toBeInTheDocument();
  });

  it('oculta el label cuando showLabel es false', () => {
    render(<BookingStatusBadge status="CONFIRMED" showLabel={false} />);
    expect(screen.queryByText('Confirmado')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Reservación confirmada')).toBeInTheDocument();
  });

  it('aplica clases personalizadas', () => {
    const { container } = render(
      <BookingStatusBadge status="CONFIRMED" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('aplica el tamaño small correctamente', () => {
    const { container } = render(<BookingStatusBadge status="CONFIRMED" size="sm" />);
    expect(container.firstChild).toHaveClass('text-xs', 'px-2', 'py-1');
  });

  it('aplica el tamaño large correctamente', () => {
    const { container } = render(<BookingStatusBadge status="CONFIRMED" size="lg" />);
    expect(container.firstChild).toHaveClass('text-base', 'px-4', 'py-2');
  });
});

describe('Booking Helper Functions', () => {
  describe('canCancelBooking', () => {
    it('retorna true para PENDING', () => {
      expect(canCancelBooking('PENDING')).toBe(true);
    });

    it('retorna true para CONFIRMED', () => {
      expect(canCancelBooking('CONFIRMED')).toBe(true);
    });

    it('retorna false para CANCELLED', () => {
      expect(canCancelBooking('CANCELLED')).toBe(false);
    });

    it('retorna false para COMPLETED', () => {
      expect(canCancelBooking('COMPLETED')).toBe(false);
    });
  });

  describe('canReviewBooking', () => {
    it('retorna true solo para COMPLETED', () => {
      expect(canReviewBooking('COMPLETED')).toBe(true);
    });

    it('retorna false para otros estados', () => {
      expect(canReviewBooking('PENDING')).toBe(false);
      expect(canReviewBooking('CONFIRMED')).toBe(false);
      expect(canReviewBooking('CANCELLED')).toBe(false);
    });
  });
});

describe('Status Labels', () => {
  it('tiene todos los labels de booking definidos', () => {
    expect(BOOKING_STATUS_LABELS.PENDING).toBe('Pendiente');
    expect(BOOKING_STATUS_LABELS.CONFIRMED).toBe('Confirmado');
    expect(BOOKING_STATUS_LABELS.CANCELLED).toBe('Cancelado');
    expect(BOOKING_STATUS_LABELS.COMPLETED).toBe('Completado');
  });
});

describe('Accesibilidad', () => {
  it('todos los badges tienen role="status"', () => {
    render(<BookingStatusBadge status="PENDING" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('todos los badges tienen aria-label descriptivo', () => {
    render(<BookingStatusBadge status="CONFIRMED" />);
    expect(screen.getByLabelText('Reservación confirmada')).toBeInTheDocument();
  });

  it('los iconos tienen aria-hidden="true"', () => {
    const { container } = render(<BookingStatusBadge status="CONFIRMED" />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
