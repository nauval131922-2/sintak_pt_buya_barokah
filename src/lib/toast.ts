export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastEventDetail {
  type: ToastType;
  message: string;
  duration?: number;
}

export const toast = {
  show: (type: ToastType, message: string, duration = 3000) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('global-toast', {
          detail: { type, message, duration } as ToastEventDetail,
        })
      );
    }
  },
  success: (message: string, duration = 3000) => toast.show('success', message, duration),
  error: (message: string, duration = 3000) => toast.show('error', message, duration),
  info: (message: string, duration = 3000) => toast.show('info', message, duration),
  warning: (message: string, duration = 3000) => toast.show('warning', message, duration),
};
