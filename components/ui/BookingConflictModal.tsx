import React, { useEffect, useRef } from 'react';
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import Modal from './Modal';

interface BookingConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
  slotTime?: string;
  loading?: boolean;
  retryCount?: number;
  errorType?: 'SLOT_UNAVAILABLE' | 'CAPACITY_EXCEEDED' | 'VERSION_CONFLICT' | 'UNKNOWN';
  availableSpots?: number;
  requestedSpots?: number;
}

/**
 * BookingConflictModal - Modal para errores de concurrencia en reservaciones (409)
 *
 * Se muestra cuando un horario fue tomado por otro usuario mientras el visitante
 * completaba su reservación.
 */
export const BookingConflictModal: React.FC<BookingConflictModalProps> = ({
  isOpen,
  onClose,
  onReload,
  slotTime,
  loading = false,
  retryCount,
  errorType,
  availableSpots,
  requestedSpots,
}) => {
  const reloadButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && reloadButtonRef.current) {
      setTimeout(() => reloadButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const title = errorType === 'VERSION_CONFLICT'
    ? 'Informacion actualizada'
    : 'La disponibilidad ha cambiado';

  const message = errorType === 'VERSION_CONFLICT'
    ? 'Los datos fueron modificados. Por favor recarga para ver los horarios actualizados.'
    : 'El horario que seleccionaste ya no esta disponible. Otro visitante lo reservo mientras completabas tu reservacion.';

  let details: string | undefined = slotTime ? `Horario solicitado: ${slotTime}` : undefined;
  if (errorType === 'CAPACITY_EXCEEDED' && availableSpots !== undefined) {
    const extraInfo = `Lugares disponibles: ${availableSpots}${requestedSpots ? `, solicitados: ${requestedSpots}` : ''}`;
    details = details ? `${details}\n${extraInfo}` : extraInfo;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" closeOnOverlay={!loading} closeOnEscape={!loading} showClose={!loading}>
      <div className="p-6">
        {/* Icon */}
        <div className="mx-auto w-14 h-14 bg-oaxaca-yellow-light dark:bg-oaxaca-yellow/20 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 text-oaxaca-yellow" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>

        {/* Details */}
        {details && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center whitespace-pre-line">
              {details}
            </p>
          </div>
        )}

        {/* Retry count indicator */}
        {retryCount !== undefined && retryCount > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-1">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < retryCount ? 'bg-oaxaca-yellow' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Intento {retryCount} de 2 fallido
            </span>
          </div>
        )}

        {/* Tip */}
        <div className="flex items-start gap-2 bg-oaxaca-sky-light dark:bg-oaxaca-sky/20 rounded-lg p-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-oaxaca-sky dark:text-oaxaca-sky mt-0.5 flex-shrink-0" />
          <p className="text-xs text-oaxaca-sky dark:text-oaxaca-sky">
            Esto ocurre cuando varios visitantes reservan al mismo tiempo. No te preocupes, hay mas horarios disponibles.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            ref={reloadButtonRef}
            onClick={onReload}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-oaxaca-yellow hover:bg-oaxaca-yellow/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-oaxaca-yellow focus:ring-offset-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Ver horarios disponibles
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BookingConflictModal;
