'use client';

import { X, LucideIcon } from 'lucide-react';
import { useEffect } from 'react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string; // e.g., 'max-w-lg', 'max-w-2xl'
  bodyClassName?: string;
}

export default function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = 'max-w-lg',
  bodyClassName
}: BaseModalProps) {
  
  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-emerald-50 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Icon size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-800 tracking-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-gray-500 font-medium">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body — scrollable */}
        <div className={`px-6 py-5 flex flex-col gap-5 custom-scrollbar ${bodyClassName || 'overflow-y-auto'}`}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
