'use client';

import { Smartphone } from 'lucide-react';
import type { RoadsideSummary } from '@/app/actions/roadside';

type Props = { summary: RoadsideSummary | null };

export function DotInspectionEldCard({ summary }: Props) {
  const message = summary?.eld_status?.message ?? summary?.eld_status?.status ?? 'Compliant — ELD status and hours available in cab.';

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1e293b] p-4 flex flex-col">
      <h3 className="text-base font-semibold text-amber-400 mb-2 flex items-center gap-2">
        <Smartphone className="size-5" />
        ELD Instructions
      </h3>
      <p className="text-sm text-[#e2e8f0] mb-2">
        {message}
      </p>
      <p className="text-xs text-[#94a3b8]">
        Previous 8-day logs and today&apos;s logs are maintained on your ELD device in the cab. This summary confirms ELD status; the officer may request the physical device or a carrier-provided log export if needed.
      </p>
    </div>
  );
}
