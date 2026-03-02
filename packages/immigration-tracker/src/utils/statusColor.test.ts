import { describe, it, expect } from 'vitest';
import { getStatusColor, getColorClasses } from './statusColor';

describe('getStatusColor', () => {
  it('returns green for approved statuses', () => {
    expect(getStatusColor('Case Was Approved')).toBe('green');
    expect(getStatusColor('New Card Is Being Produced')).toBe('green');
    expect(getStatusColor('Card Was Mailed To Me')).toBe('green');
    expect(getStatusColor('Card Was Delivered To Me By The Post Office')).toBe('green');
  });

  it('returns yellow for RFE and interview statuses', () => {
    expect(getStatusColor('Request for Initial Evidence Was Sent')).toBe('yellow');
    expect(getStatusColor('Request for Additional Evidence Was Sent')).toBe('yellow');
    expect(getStatusColor('Interview Was Scheduled')).toBe('yellow');
  });

  it('returns blue for received status', () => {
    expect(getStatusColor('Case Was Received')).toBe('blue');
  });

  it('returns red for denied status', () => {
    expect(getStatusColor('Case Was Denied')).toBe('red');
  });

  it('returns gray for unknown statuses', () => {
    expect(getStatusColor('Some Unknown Status')).toBe('gray');
    expect(getStatusColor('')).toBe('gray');
  });
});

describe('getColorClasses', () => {
  it('returns classes for each color', () => {
    const green = getColorClasses('green');
    expect(green.bg).toContain('green');
    expect(green.text).toContain('green');
    expect(green.dot).toContain('green');

    const gray = getColorClasses('gray');
    expect(gray.bg).toContain('gray');
  });
});
