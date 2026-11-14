import { formatPhoneUniversal, parseDateStringToTimestamp } from '../../utils';

export const formatCustomerName = (name?: any) => {
  const str = String(name || '').trim();
  if (!str) return '';
  const words = str.split(/\s+/).slice(0, 2);
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatDisplayPhone = (phone?: string) => {
  return formatPhoneUniversal(phone);
};

export const getRelativeDayDetails = (orderTime: number, appLanguage: string) => {
  if (!orderTime || orderTime <= 0) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const orderDate = new Date(orderTime);
  orderDate.setHours(0, 0, 0, 0);
  
  const diffTime = orderDate.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return {
      text: appLanguage === 'ms' ? 'HARI INI' : 'TODAY',
      className: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
    };
  } else if (diffDays === 1) {
    return {
      text: appLanguage === 'ms' ? 'ESOK' : 'TOMORROW',
      className: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
    };
  } else if (diffDays === 2) {
    return {
      text: appLanguage === 'ms' ? '2 HARI LAGI' : 'IN 2 DAYS',
      className: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50'
    };
  } else if (diffDays === 3) {
    return {
      text: appLanguage === 'ms' ? '3 HARI LAGI' : 'IN 3 DAYS',
      className: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
    };
  } else if (diffDays > 3) {
    return {
      text: appLanguage === 'ms' ? `${diffDays} HARI LAGI` : `IN ${diffDays} DAYS`,
      className: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
    };
  } else if (diffDays === -1) {
    return {
      text: appLanguage === 'ms' ? 'SEMALAM' : 'YESTERDAY',
      className: 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
    };
  } else if (diffDays === -2) {
    return {
      text: appLanguage === 'ms' ? '2 HARI LEPAS' : '2 DAYS AGO',
      className: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
    };
  } else if (diffDays < -2) {
    return {
      text: appLanguage === 'ms' ? `${Math.abs(diffDays)} HARI LEPAS` : `${Math.abs(diffDays)} DAYS AGO`,
      className: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
    };
  }
  return null;
};

export const parseDueTimestamp = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return 0;
  }

  return parseDateStringToTimestamp(value, 0).timestamp;
};
