import React from 'react';

// ─── Dialog ───────────────────────────────────────────────────────────────────
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  );
};

export const DialogContent: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-dark-800 border border-white/10 rounded-2xl p-6 shadow-2xl ${className}`}>{children}</div>
);

export const DialogHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <h2 className="text-lg font-semibold text-white">{children}</h2>
);

export const DialogDescription: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-neutral-400 mt-1">{children}</p>
);

export const DialogFooter: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex justify-end gap-3 mt-6 ${className}`}>{children}</div>
);
