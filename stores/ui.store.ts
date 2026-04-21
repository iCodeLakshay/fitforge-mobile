import { create } from 'zustand';

// ─── UI Store ─────────────────────────────────────────────────────────────────
// Transient UI state (toasts, bottom sheets, global loading)

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id:       string;
  type:     ToastType;
  message:  string;
  duration: number;   // ms
}

interface UIState {
  toasts:           Toast[];
  globalLoading:    boolean;
  loadingMessage:   string;

  showToast:   (type: ToastType, message: string, duration?: number) => void;
  hideToast:   (id: string) => void;
  setLoading:  (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts:         [],
  globalLoading:  false,
  loadingMessage: '',

  showToast: (type, message, duration = 3000) => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
    // Auto-hide
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  hideToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setLoading: (loading, message = 'Please wait...') =>
    set({ globalLoading: loading, loadingMessage: message }),
}));

// ─── Convenience helpers ─────────────────────────────────────────────────────
export const showSuccess = (msg: string) => useUIStore.getState().showToast('success', msg);
export const showError   = (msg: string) => useUIStore.getState().showToast('error',   msg);
export const showWarning = (msg: string) => useUIStore.getState().showToast('warning', msg);
export const showInfo    = (msg: string) => useUIStore.getState().showToast('info',    msg);
