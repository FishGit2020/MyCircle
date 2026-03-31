import type { Trip } from '../types';

const TICKET_LABELS: Record<string, string> = {
  flight: 'Flight',
  train: 'Train',
  bus: 'Bus',
  boat: 'Boat',
  other: 'Ticket',
};

export function formatTripExport(trip: Trip): string {
  const lines: string[] = [];
  const currency = trip.currency || '';

  lines.push(trip.destination);
  lines.push(`Dates: ${trip.startDate || 'TBD'} \u2192 ${trip.endDate || 'TBD'}`);

  if (trip.status) {
    const statusLabels: Record<string, string> = {
      planning: 'Planning',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    lines.push(`Status: ${statusLabels[trip.status] ?? trip.status}`);
  }

  if (trip.budget > 0) {
    const activitySpend = trip.itinerary.reduce(
      (sum, day) => sum + day.activities.reduce((s, a) => s + (a.cost || 0), 0), 0,
    );
    const ticketSpend = (trip.tickets || []).reduce((s, t) => s + (t.cost || 0), 0);
    const totalSpent = activitySpend + ticketSpend;
    lines.push(`Budget: ${currency} ${totalSpent.toLocaleString()} / ${trip.budget.toLocaleString()}`);
  }

  // Checklist
  const checklist = trip.checklist || [];
  if (checklist.length > 0) {
    lines.push('');
    lines.push('=== Checklist ===');
    for (const item of checklist) {
      lines.push(`${item.checked ? '[x]' : '[ ]'} ${item.text}`);
    }
  }

  // Tickets
  const tickets = (trip.tickets || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (tickets.length > 0) {
    lines.push('');
    lines.push('=== Tickets ===');
    for (const ticket of tickets) {
      const label = TICKET_LABELS[ticket.type] ?? 'Ticket';
      const costPart = ticket.cost && ticket.cost > 0 ? ` \u2014 ${currency} ${ticket.cost}` : '';
      lines.push(`${label}: ${ticket.description} \u2014 ${ticket.date}${costPart}`);
    }
  }

  // Itinerary days
  if (trip.startDate && trip.endDate) {
    const dayMap = new Map<string, typeof trip.itinerary[0]>();
    for (const day of trip.itinerary) {
      const existing = dayMap.get(day.date);
      if (existing) {
        dayMap.set(day.date, { ...existing, activities: [...existing.activities, ...day.activities] });
      } else {
        dayMap.set(day.date, day);
      }
    }

    const [sy, sm, sd] = trip.startDate.split('-').map(Number);
    const [ey, em, ed] = trip.endDate.split('-').map(Number);
    const cur = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    let idx = 1;

    while (cur <= end) {
      const y = cur.getFullYear();
      const mo = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${mo}-${d}`;
      const label = cur.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      lines.push('');
      lines.push(`=== Day ${idx} \u2014 ${label} ===`);

      const day = dayMap.get(dateStr);
      const sorted = (day?.activities || []).slice().sort((a, b) => a.time.localeCompare(b.time));
      if (sorted.length === 0) {
        lines.push('(no activities)');
      } else {
        for (const act of sorted) {
          lines.push(`${act.time}  ${act.title}`);
          if (act.location) lines.push(`       ${act.location}`);
          if (act.cost > 0) lines.push(`       Cost: ${currency} ${act.cost}`);
          if (act.notes) lines.push(`       Notes: ${act.notes}`);
        }
      }

      cur.setDate(cur.getDate() + 1);
      idx++;
    }
  }

  return lines.join('\n');
}
