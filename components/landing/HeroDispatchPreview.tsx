'use client';

import { LayoutGrid, Truck } from 'lucide-react';
import { demoLoads, demoLoadLaneLabel } from '@/src/constants/demoData';
import { DemoMapMock } from '@/components/landing/DemoMapMock';

const statusDot: Record<string, string> = {
  'In Transit': 'bg-emerald-400',
  'At Pickup': 'bg-cyber-amber',
  Delivered: 'bg-sky-400',
};

/**
 * Scaled-down, non-interactive dispatch + map — used in marketing hero instead of video.
 */
export function HeroDispatchPreview() {
  return (
    <div className="w-full max-w-xl mx-auto lg:mx-0 lg:max-w-none">
      <div className="rounded-2xl border border-white/10 bg-[#0a0f1a]/90 shadow-[0_0_60px_-16px_rgba(255,176,0,0.2)] overflow-hidden backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 bg-midnight-ink/80">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500/80" aria-hidden />
            <span className="size-2.5 rounded-full bg-amber-400/80" aria-hidden />
            <span className="size-2.5 rounded-full bg-emerald-500/80" aria-hidden />
          </div>
          <span className="text-[10px] font-mono text-soft-cloud/45 truncate flex-1 text-center">
            dispatch.vantagfleet.com — preview
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-0">
          <div className="sm:col-span-3 p-3 border-b sm:border-b-0 sm:border-r border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyber-amber/90 mb-2">
              Live interactive dashboard preview
            </p>
            <DemoMapMock compact className="shadow-inner" />
          </div>
          <div className="sm:col-span-2 flex flex-col p-3 bg-[#070b12]/95 min-h-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyber-amber/30 bg-cyber-amber/10">
                <LayoutGrid className="size-3.5 text-cyber-amber" aria-hidden />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-cyber-amber/90">
                  Dispatch board
                </p>
                <p className="text-[9px] text-soft-cloud/45">Active loads</p>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              {demoLoads.map((load) => (
                <div
                  key={load.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-midnight-ink/70 px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono font-semibold text-cyber-amber">{load.reference_number}</p>
                    <p className="text-[9px] text-soft-cloud/55 truncate">{demoLoadLaneLabel(load)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Truck className="size-3 text-soft-cloud/30" aria-hidden />
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusDot[load.status] ?? 'bg-slate-400'}`}
                      aria-hidden
                    />
                    <span className="text-[9px] font-medium text-soft-cloud/70 whitespace-nowrap">
                      {load.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-soft-cloud/35">Non-interactive preview — same data as the interactive demo</p>
    </div>
  );
}
