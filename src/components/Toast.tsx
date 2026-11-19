"use client";

import { useEffect } from "react";

export interface ToastData {
  id: number;
  text: string;
  onUndo?: () => void;
}

/** A small note at the bottom of the screen, with Undo. Disappears after a few seconds. */
export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{toast.text}</span>
      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            onClose();
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
}
