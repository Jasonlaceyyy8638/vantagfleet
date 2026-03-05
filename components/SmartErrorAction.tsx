'use client';

import { useState } from 'react';
import { AlertCircle, MessageCircle } from 'lucide-react';
import { SupportTicketModal } from '@/components/SupportTicketModal';

export type EldProviderName = 'Motive' | 'Geotab';

type Props = {
  /** Error message or code from the ELD API (Motive/Geotab). */
  errorMessage: string;
  /** Which ELD provider failed; included in the pre-filled description and in metadata (API attaches from integration status). */
  eldProvider?: EldProviderName;
  /** Optional short label above the button (e.g. "Connection failed"). */
  label?: string;
  /** Optional class for the container. */
  className?: string;
};

/**
 * Shown when an ELD API call returns an error or disconnected state.
 * Renders a "Report Connection Issue to Support" button that opens SupportTicketModal
 * with subject "ELD Connection Error" and description pre-filled with the error and provider.
 */
export function SmartErrorAction({ errorMessage, eldProvider, label = 'Connection issue', className = '' }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const description = [
    errorMessage.trim(),
    eldProvider ? `\n\nELD Provider: ${eldProvider}` : '',
  ].join('').trim();

  return (
    <div className={`rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-amber-500/20 p-1.5">
          <AlertCircle className="size-4 text-amber-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          {label && (
            <p className="text-sm font-medium text-amber-200/90 mb-0.5">
              {label}
            </p>
          )}
          <p className="text-xs text-soft-cloud/70 mb-3">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
          >
            <MessageCircle className="size-4" aria-hidden />
            Report Connection Issue to Support
          </button>
        </div>
      </div>
      <SupportTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialSubject="ELD Connection Error"
        initialDescription={description}
      />
    </div>
  );
}
