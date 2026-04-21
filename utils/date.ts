// Date formatting utilities for FitForge

export function formatDate(dateStr: string): string {
  // YYYY-MM-DD → "14 Apr 2025"
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  // YYYY-MM-DD → "14 Apr"
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatTimestamp(ts: number): string {
  // Unix ms → "9:43 AM"
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function getDaysLeft(endDate: string): number {
  const end = new Date(endDate).setHours(23, 59, 59, 0);
  return Math.ceil((end - Date.now()) / 86400000);
}

export function getMonthProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  const now   = Date.now();
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000)   return `₹${(rupees / 1000).toFixed(1)}k`;
  return `₹${rupees.toFixed(0)}`;
}

export function formatRupeesRaw(rupees: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
}
