import React, { useState } from 'react';
import { Check, Calendar, Loader2, Bell, BellOff } from 'lucide-react';
import { createRSVP, deleteRSVP, createReminder, deleteReminder } from '../../services/events';
import { useAuth } from '../../contexts/AuthContext';
import haptics from '../../services/haptics';

interface RSVPButtonProps {
  eventId: string;
  hasRSVP: boolean;
  hasReminder?: boolean;
  eventDate: string;
  onUpdate?: (hasRSVP: boolean, hasReminder: boolean) => void;
  showReminder?: boolean;
}

const RSVPButton: React.FC<RSVPButtonProps> = ({
  eventId,
  hasRSVP: initialHasRSVP,
  hasReminder: initialHasReminder = false,
  eventDate,
  onUpdate,
  showReminder = true,
}) => {
  const { token, isAuthenticated } = useAuth();
  const [hasRSVP, setHasRSVP] = useState(initialHasRSVP);
  const [hasReminder, setHasReminder] = useState(initialHasReminder);
  const [loading, setLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  const handleRSVP = async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    setLoading(true);
    haptics.tap();

    try {
      if (hasRSVP) {
        await deleteRSVP(eventId, token);
        setHasRSVP(false);
        // Also remove reminder if deleting RSVP
        if (hasReminder) {
          await deleteReminder(eventId, token);
          setHasReminder(false);
        }
        onUpdate?.(false, false);
      } else {
        await createRSVP(eventId, token);
        setHasRSVP(true);
        onUpdate?.(true, hasReminder);
      }
      haptics.success();
    } catch (error) {
      console.error('RSVP error:', error);
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const handleReminder = async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    setReminderLoading(true);
    haptics.tap();

    try {
      if (hasReminder) {
        await deleteReminder(eventId, token);
        setHasReminder(false);
        onUpdate?.(hasRSVP, false);
      } else {
        // Set reminder 1 hour before event
        const eventTime = new Date(eventDate);
        const reminderTime = new Date(eventTime.getTime() - 60 * 60 * 1000);

        // Only create if reminder time is in the future
        if (reminderTime > new Date()) {
          await createReminder(eventId, reminderTime, token);
          setHasReminder(true);
          onUpdate?.(hasRSVP, true);
        }
      }
      haptics.success();
    } catch (error) {
      console.error('Reminder error:', error);
      haptics.error();
    } finally {
      setReminderLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* RSVP Button */}
      <button
        onClick={handleRSVP}
        disabled={loading || !isAuthenticated}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
          hasRSVP
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-oaxaca-pink text-white hover:bg-oaxaca-pink/90'
        } ${loading ? 'opacity-70' : ''} ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : hasRSVP ? (
          <>
            <Check size={20} />
            <span>Asistiré</span>
          </>
        ) : (
          <>
            <Calendar size={20} />
            <span>Confirmar asistencia</span>
          </>
        )}
      </button>

      {/* Reminder Button */}
      {showReminder && hasRSVP && (
        <button
          onClick={handleReminder}
          disabled={reminderLoading || !isAuthenticated}
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
            hasReminder
              ? 'bg-oaxaca-gold text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          } ${reminderLoading ? 'opacity-70' : ''}`}
          title={hasReminder ? 'Eliminar recordatorio' : 'Agregar recordatorio'}
        >
          {reminderLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : hasReminder ? (
            <Bell size={20} />
          ) : (
            <BellOff size={20} />
          )}
        </button>
      )}
    </div>
  );
};

export default RSVPButton;
