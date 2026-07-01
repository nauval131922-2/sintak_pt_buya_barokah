'use client';

import { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string | null;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isShowing, setIsShowing] = useState(false);
  const [progress, setProgress] = useState(100);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    let exitTimer: NodeJS.Timeout;
    if (message) {
      setIsShowing(true);
      setProgress(100);
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
      }, 16);
      const timer = setTimeout(() => {
        setIsShowing(true);
        setIsShowing(false);
        clearInterval(progressInterval);
        exitTimer = setTimeout(() => onCloseRef.current(), 300);
      }, duration);
      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
        if (exitTimer) clearTimeout(exitTimer);
      };
    } else {
      setIsShowing(false);
    }
  // ponytail: onClose via ref to avoid restarting timers on every parent render
  }, [message, duration]);

  if (!message && !isShowing) return null;

  const styles: Record<ToastType, { border: string; icon: string; strip: string; iconBg: string }> = {
    success: { border: 'border-green-100',  icon: 'text-green-500',  strip: 'bg-green-500',  iconBg: 'bg-green-50' },
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
            pointer-events-auto overflow-hidden
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

          <div className="flex-1 min-w-0 py-3">
            {/* icon + message row */}
            <div className="flex items-start gap-3">
              <div className={`shrink-0 p-1.5 rounded-lg ${s.iconBg} ${s.icon} -mt-1`}>
                {icons[type]}
              </div>
              <div className="flex-1 text-[13px] font-medium text-gray-700 tracking-tight">
                {message}
              </div>
              <button
                onClick={() => { setIsShowing(false); setTimeout(onClose, 300); }}
                className="shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-300 hover:text-gray-500 -mt-1 -mr-1"
              >
                <X size={14} />
              </button>
            </div>
            {/* timer bar */}
            <div className="mt-2 h-0.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${s.strip}`}
                style={{ width: `${progress}%` }}
              />
            </div>
        </div>
      </div>
    );
  }
