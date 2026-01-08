import type { LabelColor, Priority } from '../types';

export const labelColors: Record<LabelColor, { bg: string; text: string; border: string; light: string }> = {
  red: {
    bg: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500',
    light: 'bg-red-100 dark:bg-red-900/30',
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    light: 'bg-orange-100 dark:bg-orange-900/30',
  },
  yellow: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    light: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    light: 'bg-green-100 dark:bg-green-900/30',
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    border: 'border-blue-500',
    light: 'bg-blue-100 dark:bg-blue-900/30',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-500',
    border: 'border-purple-500',
    light: 'bg-purple-100 dark:bg-purple-900/30',
  },
  pink: {
    bg: 'bg-pink-500',
    text: 'text-pink-500',
    border: 'border-pink-500',
    light: 'bg-pink-100 dark:bg-pink-900/30',
  },
  gray: {
    bg: 'bg-gray-500',
    text: 'text-gray-500',
    border: 'border-gray-500',
    light: 'bg-gray-100 dark:bg-gray-700/30',
  },
};

export const priorityColors: Record<Priority, { bg: string; text: string; icon: string }> = {
  low: {
    bg: 'bg-slate-100 dark:bg-slate-700',
    text: 'text-slate-600 dark:text-slate-300',
    icon: 'text-slate-400',
  },
  medium: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-300',
    icon: 'text-blue-500',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-300',
    icon: 'text-orange-500',
  },
  urgent: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-300',
    icon: 'text-red-500',
  },
};

export const coverColors: Record<LabelColor, string> = {
  red: 'bg-gradient-to-r from-red-500 to-rose-500',
  orange: 'bg-gradient-to-r from-orange-500 to-amber-500',
  yellow: 'bg-gradient-to-r from-yellow-500 to-amber-400',
  green: 'bg-gradient-to-r from-green-500 to-emerald-500',
  blue: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  purple: 'bg-gradient-to-r from-purple-500 to-violet-500',
  pink: 'bg-gradient-to-r from-pink-500 to-rose-400',
  gray: 'bg-gradient-to-r from-gray-500 to-slate-500',
};

export const columnHeaderColors: Record<LabelColor, string> = {
  red: 'from-red-500/20 to-transparent border-l-red-500',
  orange: 'from-orange-500/20 to-transparent border-l-orange-500',
  yellow: 'from-yellow-500/20 to-transparent border-l-yellow-500',
  green: 'from-green-500/20 to-transparent border-l-green-500',
  blue: 'from-blue-500/20 to-transparent border-l-blue-500',
  purple: 'from-purple-500/20 to-transparent border-l-purple-500',
  pink: 'from-pink-500/20 to-transparent border-l-pink-500',
  gray: 'from-gray-500/20 to-transparent border-l-gray-500',
};
