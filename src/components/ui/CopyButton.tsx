"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  size?: number;
  className?: string;
  title?: string;
}

export default function CopyButton({
  text,
  size = 12,
  className = "",
  title = "Salin",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed", err);
        } finally {
          textArea.remove();
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center h-6 w-6 rounded-md shrink-0 cursor-pointer select-none transition-all duration-150 active:scale-90 ${
        copied
          ? "!opacity-100 bg-emerald-500 border border-emerald-500 text-white shadow-xs scale-105"
          : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-700 bg-slate-50/90 hover:bg-emerald-50/90 border border-slate-200/80 hover:border-emerald-300 shadow-2xs"
      } ${className}`}
      title={copied ? "Tersalin!" : title}
    >
      {copied ? (
        <Check size={size} strokeWidth={2.5} className="animate-in zoom-in-75 duration-150" />
      ) : (
        <Copy size={size} strokeWidth={2} />
      )}
    </button>
  );
}
