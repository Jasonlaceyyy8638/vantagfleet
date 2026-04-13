'use client';

import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Truck, Building2, X } from 'lucide-react';

export function DemoRolePickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  if (!open || typeof document === 'undefined') return null;

  const go = (role: 'carrier' | 'broker') => {
    router.push(`/dashboard?mode=demo&role=${role}`);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal
      aria-labelledby="demo-role-title"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border-2 border-lime-400/90 bg-midnight-ink shadow-[0_0_60px_-12px_rgba(190,242,100,0.45)] p-6 sm:p-8">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            <h2 id="demo-role-title" className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Choose your sandbox
            </h2>
            <p className="text-sm text-soft-cloud/75 mt-2">
              Explore the interactive demo as a carrier operation or a broker desk. No signup required.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-soft-cloud/70 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => go('carrier')}
            className="group flex flex-col items-stretch text-left rounded-xl border-2 border-lime-400/70 bg-lime-400/10 hover:bg-lime-400/20 px-5 py-6 transition-colors min-h-[120px]"
          >
            <Truck className="size-8 text-lime-300 mb-3 shrink-0" aria-hidden />
            <span className="font-bold text-white text-lg">Explore as a Carrier</span>
            <span className="text-xs text-soft-cloud/80 mt-2 leading-relaxed">
              Dispatch, fleet, IFTA, and compliance with Lacey Logistics sample data.
            </span>
          </button>
          <button
            type="button"
            onClick={() => go('broker')}
            className="group flex flex-col items-stretch text-left rounded-xl border-2 border-cyber-amber/80 bg-cyber-amber/10 hover:bg-cyber-amber/20 px-5 py-6 transition-colors min-h-[120px]"
          >
            <Building2 className="size-8 text-cyber-amber mb-3 shrink-0" aria-hidden />
            <span className="font-bold text-white text-lg">Explore as a Broker</span>
            <span className="text-xs text-soft-cloud/80 mt-2 leading-relaxed">
              Tendered loads, carrier vetting, and broker settlements preview.
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
