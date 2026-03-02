import type { StatusColor } from '../types';

const STATUS_COLORS: Record<string, StatusColor> = {
  'Case Was Received': 'blue',
  'Case Was Approved': 'green',
  'New Card Is Being Produced': 'green',
  'Card Was Mailed To Me': 'green',
  'Card Was Picked Up By The United States Postal Service': 'green',
  'Card Was Delivered To Me By The Post Office': 'green',
  'Case Was Denied': 'red',
  'Request for Initial Evidence Was Sent': 'yellow',
  'Request for Additional Evidence Was Sent': 'yellow',
  'Case Was Transferred And A New Office Has Jurisdiction': 'yellow',
  'Interview Was Scheduled': 'yellow',
  'Case Is Ready To Be Scheduled For An Interview': 'yellow',
};

export function getStatusColor(status: string): StatusColor {
  return STATUS_COLORS[status] || 'gray';
}

const COLOR_CLASSES: Record<StatusColor, { bg: string; text: string; dot: string }> = {
  green:  { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  gray:   { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-400' },
};

export function getColorClasses(color: StatusColor) {
  return COLOR_CLASSES[color];
}
