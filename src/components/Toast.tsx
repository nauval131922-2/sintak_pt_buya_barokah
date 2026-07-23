'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail || !detail.message) return;

      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, ...detail }]);
    };

    window.addEventListener('global-toast', handleGlobalToast);
    return () => {
      window.removeEventListener('global-toast', handleGlobalToast);
    };
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[9999999] pointer-events-none flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

function ToastItem({ message, type, duration = 3000, onClose }: ToastItemProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    setIsShowing(true);
    const timer = setTimeout(() => {
      setIsShowing(false);
      const exitTimer = setTimeout(onClose, 300);
      return () => clearTimeout(exitTimer);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles: Record<ToastType, { border: string; icon: string; strip: string; iconBg: string }> = {
    success: { border: 'border-emerald-100',  icon: 'text-emerald-500',  strip: 'bg-emerald-500',  iconBg: 'bg-emerald-50' },
    error:   { border: 'border-red-100',    icon: 'text-red-500',    strip: 'bg-red-500',    iconBg: 'bg-red-50' },
    info:    { border: 'border-blue-100',   icon: 'text-blue-500',   strip: 'bg-blue-500',   iconBg: 'bg-blue-50' },
    warning: { border: 'border-amber-100',  icon: 'text-amber-500',  strip: 'bg-amber-500',  iconBg: 'bg-amber-50' },
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} />,
    error:   <AlertCircle size={16} />,
    info:    <Info size={16} />,
    warning: <AlertCircle size={16} />,
  };

  const s = styles[type];

  return (
    <div
      className={`
        pointer-events-auto overflow-hidden relative
        flex items-center gap-3 pr-3 pl-0 py-0 rounded-xl border bg-white
        shadow-lg shadow-black/8
        transition-all duration-300 ease-out
        ${isShowing ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-6 opacity-0 scale-95'}
        ${s.border}
      `}
      style={{ minWidth: '300px', maxWidth: '380px' }}
    >
      {/* accent strip */}
      <div className={`self-stretch w-1 shrink-0 rounded-l-xl ${s.strip}`} />

      {/* icon */}
      <div className={`shrink-0 p-1.5 rounded-lg ${s.iconBg} ${s.icon} my-3 ml-1`}>
        {icons[type]}
      </div>

      {/* message */}
      <div className="flex-1 text-[13px] font-medium text-gray-700 tracking-tight py-3 mb-[2px]">
        {message}
      </div>

      {/* close */}
      <button
        onClick={() => {
          setIsShowing(false);
          setTimeout(onClose, 300);
        }}
        className="shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-300 hover:text-gray-500 ml-1 z-10"
      >
        <X size={14} />
      </button>

      {/* progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[3px] ${s.strip}`}
        style={{
          animation: `toast-shrink ${duration}ms linear forwards`
        }}
      />
    </div>
  );
}

// Keep backward compatibility for single local Toast instances
interface ToastProps {
  message: string | null;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    let exitTimer: NodeJS.Timeout;
    if (message) {
      setIsShowing(true);
      const timer = setTimeout(() => {
        setIsShowing(true);
        setIsShowing(false);
        exitTimer = setTimeout(onClose, 300);
      }, duration);
      return () => {
        clearTimeout(timer);
        if (exitTimer) clearTimeout(exitTimer);
      };
    } else {
      setIsShowing(false);
    }
  }, [message, duration, onClose]);

  if (!message && !isShowing) return null;

  const styles: Record<ToastType, { border: string; icon: string; strip: string; iconBg: string }> = {
    success: { border: 'border-emerald-100',  icon: 'text-emerald-500',  strip: 'bg-emerald-500',  iconBg: 'bg-emerald-50' },
    error:   { border: 'border-red-100',    icon: 'text-red-500',    strip: 'bg-red-500',    iconBg: 'bg-red-50' },
    info:    { border: 'border-blue-100',   icon: 'text-blue-500',   strip: 'bg-blue-500',   iconBg: 'bg-blue-50' },
    warning: { border: 'border-amber-100',  icon: 'text-amber-500',  strip: 'bg-amber-500',  iconBg: 'bg-amber-50' },
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} />,
    error:   <AlertCircle size={16} />,
    info:    <Info size={16} />,
    warning: <AlertCircle size={16} />,
  };

  const s = styles[type];

  return (
    <div className="fixed top-6 right-6 z-[9999999] pointer-events-none">
      <div
        className={`
          pointer-events-auto overflow-hidden relative
          flex items-center gap-3 pr-3 pl-0 py-0 rounded-xl border bg-white
          shadow-lg shadow-black/8
          transition-all duration-300 ease-out
          ${isShowing ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-6 opacity-0 scale-95'}
          ${s.border}
        `}
        style={{ minWidth: '300px', maxWidth: '380px' }}
      >
        {/* accent strip */}
        <div className={`self-stretch w-1 shrink-0 rounded-l-xl ${s.strip}`} />

        {/* icon */}
        <div className={`shrink-0 p-1.5 rounded-lg ${s.iconBg} ${s.icon} my-3 ml-1`}>
          {icons[type]}
        </div>

        {/* message */}
        <div className="flex-1 text-[13px] font-medium text-gray-700 tracking-tight py-3 mb-[2px]">
          {message}
        </div>

        {/* close */}
        <button
          onClick={() => { setIsShowing(false); setTimeout(onClose, 300); }}
          className="shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-300 hover:text-gray-500 ml-1 z-10"
        >
          <X size={14} />
        </button>

        {/* progress bar */}
        <div
          className={`absolute bottom-0 left-0 h-[3px] ${s.strip}`}
          style={{
            animation: `toast-shrink ${duration}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
}
