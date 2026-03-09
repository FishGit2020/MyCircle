import { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Trip, Activity, ItineraryDay, Ticket } from '../types';

interface TripDetailProps {
  trip: Trip;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onUpdate: (id: string, data: Partial<Trip>) => void;
}

function generateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd);
  const endDate = new Date(ey, em - 1, ed);
  while (current <= endDate) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default function TripDetail({ trip, onEdit, onDelete, onBack, onUpdate }: TripDetailProps) {
  const { t } = useTranslation();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [actTitle, setActTitle] = useState('');
  const [actTime, setActTime] = useState('09:00');
  const [actLocation, setActLocation] = useState('');
  const [actCost, setActCost] = useState(0);
  const [addingTicket, setAddingTicket] = useState(false);
  const [ticketType, setTicketType] = useState<Ticket['type']>('flight');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketDate, setTicketDate] = useState(trip.startDate);

  const dates = generateDates(trip.startDate, trip.endDate);
  const totalSpent = trip.itinerary.reduce(
    (sum, day) => sum + day.activities.reduce((s, a) => s + (a.cost || 0), 0),
    0,
  );

  const handleAddActivity = useCallback((date: string) => {
    if (!actTitle.trim()) return;
    const activity: Activity = {
      id: `act-${Date.now()}`,
      time: actTime,
      title: actTitle.trim(),
      location: actLocation.trim(),
      notes: '',
      cost: actCost,
    };

    const existingDay = trip.itinerary.find(d => d.date === date);
    let updated: ItineraryDay[];
    if (existingDay) {
      updated = trip.itinerary.map(d =>
        d.date === date ? { ...d, activities: [...d.activities, activity].sort((a, b) => a.time.localeCompare(b.time)) } : d,
      );
    } else {
      updated = [...trip.itinerary, { date, activities: [activity] }];
    }

    onUpdate(trip.id, { itinerary: updated });
    setActTitle('');
    setActLocation('');
    setActCost(0);
    setAddingTo(null);
  }, [actTitle, actTime, actLocation, actCost, trip, onUpdate]);

  const handleDeleteActivity = useCallback((date: string, activityId: string) => {
    const updated = trip.itinerary
      .map(d => d.date === date ? { ...d, activities: d.activities.filter(a => a.id !== activityId) } : d)
      .filter(d => d.activities.length > 0);
    onUpdate(trip.id, { itinerary: updated });
  }, [trip, onUpdate]);

  const handleAddTicket = useCallback(() => {
    if (!ticketDesc.trim()) return;
    const ticket: Ticket = {
      id: `tkt-${Date.now()}`,
      type: ticketType,
      description: ticketDesc.trim(),
      date: ticketDate,
    };
    onUpdate(trip.id, { tickets: [...(trip.tickets || []), ticket] });
    setTicketDesc('');
    setAddingTicket(false);
  }, [ticketType, ticketDesc, ticketDate, trip, onUpdate]);

  const handleDeleteTicket = useCallback((ticketId: string) => {
    onUpdate(trip.id, { tickets: (trip.tickets || []).filter(t => t.id !== ticketId) });
  }, [trip, onUpdate]);

  const TICKET_ICONS: Record<Ticket['type'], string> = {
    flight: '\u2708',
    train: '\u{1F682}',
    bus: '\u{1F68C}',
    boat: '\u26F5',
    other: '\u{1F3AB}',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2">
            &larr; {t('tripPlanner.back')}
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{trip.destination}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            {' – '}
            {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            {t('tripPlanner.edit')}
          </button>
          <button type="button" onClick={onDelete} className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
            {t('tripPlanner.delete')}
          </button>
        </div>
      </div>

      {/* Budget summary */}
      {trip.budget > 0 && (
        <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
          <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">{t('tripPlanner.budget')}</span>
          <div className="text-right">
            <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
              {trip.currency} {totalSpent.toLocaleString()} / {trip.budget.toLocaleString()}
            </span>
            {totalSpent > trip.budget && (
              <p className="text-xs text-red-500">{t('tripPlanner.overBudget')}</p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {trip.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">{trip.notes}</p>
      )}

      {/* Tickets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('tripPlanner.tickets')}</h3>
          <button
            type="button"
            onClick={() => setAddingTicket(!addingTicket)}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            + {t('tripPlanner.addTicket')}
          </button>
        </div>

        {addingTicket && (
          <div className="p-3 mb-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
            <div className="flex gap-2">
              <select
                value={ticketType}
                onChange={e => setTicketType(e.target.value as Ticket['type'])}
                className="w-28 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-label={t('tripPlanner.ticketType')}
              >
                <option value="flight">{t('tripPlanner.ticketFlight')}</option>
                <option value="train">{t('tripPlanner.ticketTrain')}</option>
                <option value="bus">{t('tripPlanner.ticketBus')}</option>
                <option value="boat">{t('tripPlanner.ticketBoat')}</option>
                <option value="other">{t('tripPlanner.ticketOther')}</option>
              </select>
              <input
                type="date"
                value={ticketDate}
                onChange={e => setTicketDate(e.target.value)}
                className="w-36 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <input
              type="text"
              value={ticketDesc}
              onChange={e => setTicketDesc(e.target.value)}
              placeholder={t('tripPlanner.ticketDescription')}
              className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddingTicket(false)} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
                {t('tripPlanner.cancel')}
              </button>
              <button
                type="button"
                onClick={handleAddTicket}
                disabled={!ticketDesc.trim()}
                className="px-3 py-1 text-xs bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 text-white rounded transition"
              >
                {t('tripPlanner.add')}
              </button>
            </div>
          </div>
        )}

        {(trip.tickets || []).length > 0 ? (
          <div className="space-y-2">
            {(trip.tickets || []).sort((a, b) => a.date.localeCompare(b.date)).map(ticket => (
              <div key={ticket.id} className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <span className="text-lg flex-shrink-0" aria-hidden="true">{TICKET_ICONS[ticket.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{ticket.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(ticket.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTicket(ticket.id)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition"
                  aria-label={t('tripPlanner.deleteTicket')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : !addingTicket && (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('tripPlanner.noTickets')}</p>
        )}
      </div>

      {/* Itinerary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{t('tripPlanner.itinerary')}</h3>
        <div className="space-y-4">
          {dates.map((date, idx) => {
            const day = trip.itinerary.find(d => d.date === date);
            const dayLabel = new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            return (
              <div key={date} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t('tripPlanner.day')} {idx + 1} — {dayLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddingTo(addingTo === date ? null : date)}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    + {t('tripPlanner.addActivity')}
                  </button>
                </div>

                {/* Activities */}
                {day && day.activities.length > 0 && (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {day.activities.map(act => (
                      <li key={act.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-12 flex-shrink-0">{act.time}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{act.title}</p>
                          {act.location && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{act.location}</p>
                          )}
                        </div>
                        {act.cost > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{trip.currency} {act.cost}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(date, act.id)}
                          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition"
                          aria-label={t('tripPlanner.deleteActivity')}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add activity form */}
                {addingTo === date && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={actTime}
                        onChange={e => setActTime(e.target.value)}
                        className="w-24 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={actTitle}
                        onChange={e => setActTitle(e.target.value)}
                        placeholder={t('tripPlanner.activityTitle')}
                        className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={actLocation}
                        onChange={e => setActLocation(e.target.value)}
                        placeholder={t('tripPlanner.location')}
                        className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                      <input
                        type="number"
                        value={actCost || ''}
                        onChange={e => setActCost(Number(e.target.value) || 0)}
                        placeholder={t('tripPlanner.cost')}
                        className="w-24 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setAddingTo(null)} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        {t('tripPlanner.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddActivity(date)}
                        disabled={!actTitle.trim()}
                        className="px-3 py-1 text-xs bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 text-white rounded transition"
                      >
                        {t('tripPlanner.add')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
