import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function daysUntil(date: string | Date): number {
  const target = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'inactive':
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    case 'frozen':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    case 'paid':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'unpaid':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'partial':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }
}
