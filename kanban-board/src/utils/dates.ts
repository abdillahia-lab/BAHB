import { format, formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

export const formatDueDate = (dateString: string): string => {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return 'Today';
  }

  if (isTomorrow(date)) {
    return 'Tomorrow';
  }

  return format(date, 'MMM d');
};

export const formatFullDate = (dateString: string): string => {
  return format(parseISO(dateString), 'MMMM d, yyyy');
};

export const formatDateTime = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
};

export const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
};

export const isOverdue = (dateString: string): boolean => {
  const date = parseISO(dateString);
  return isPast(date) && !isToday(date);
};

export const isDueSoon = (dateString: string): boolean => {
  const date = parseISO(dateString);
  return isToday(date) || isTomorrow(date);
};

export const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  return format(parseISO(dateString), 'yyyy-MM-dd');
};
