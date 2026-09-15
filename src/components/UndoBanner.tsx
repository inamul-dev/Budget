import React from 'react';
import { RotateCcw, Undo2, X, CheckCircle2 } from 'lucide-react';

interface UndoBannerProps {
  isOpen: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  backupDescription?: string;
}

export const UndoBanner: React.FC<UndoBannerProps> = ({
  isOpen,
  onUndo,
  onDismiss,
  backupDescription = 'Reset to 0 / Cleared history',
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="floating-undo-banner"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <RotateCcw className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="text-left">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Fresh Start: Reset to 0</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">
                Scratch Mode
              </span>
            </h4>
            <p className="text-[11px] text-slate-300">
              Budgets set to 0 & history cleared. Made a mistake?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="btn-banner-undo"
            type="button"
            onClick={onUndo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo & Restore</span>
          </button>

          <button
            id="btn-banner-dismiss"
            type="button"
            onClick={onDismiss}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
