'use client';

import { useState } from 'react';
import type { InspectSession } from '@/app/actions/inspect';
import type { HosLogEvent } from '@/lib/motive';
import { Send, FileText, Shield } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  off_duty: 'bg-slate-500',
  sleeper: 'bg-blue-600',
  driving: 'bg-emerald-600',
  on_duty: 'bg-amber-500',
  waiting: 'bg-amber-400',
};

function getStatusColor(type: string): string {
  return STATUS_COLORS[type] ?? 'bg-slate-400';
}

type Props = { session: InspectSession; token: string };

export function InspectClient({ session, token }: Props) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferCode, setTransferCode] = useState('');
  const [transferSending, setTransferSending] = useState(false);
  const [transferMessage, setTransferMessage] = useState('');
  const [showCabCard, setShowCabCard] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = transferEmail.trim();
    const code = transferCode.trim();
    if (!email && !code) {
      setTransferMessage('Enter email or file transfer code.');
      return;
    }
    setTransferSending(true);
    setTransferMessage('');
    try {
      const res = await fetch('/api/inspect/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, officerEmail: email || undefined, transferCode: code || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setTransferMessage('Logs sent successfully.');
        setTransferOpen(false);
        setTransferEmail('');
        setTransferCode('');
      } else {
        setTransferMessage(data.error ?? 'Failed to send.');
      }
    } finally {
      setTransferSending(false);
    }
  };

  const allEvents: { date: string; event: HosLogEvent }[] = [];
  session.hosLogs.forEach((day) => {
    day.events.forEach((event) => {
      allEvents.push({ date: day.date, event });
    });
  });
  allEvents.sort((a, b) => `${a.date}T${a.event.startTime}`.localeCompare(`${b.date}T${b.event.startTime}`));

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 pb-24">
      <header className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">DOT Officer Inspection</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Read-only — Last 8 days HOS</p>
      </header>

      <section className="rounded-xl border border-white/10 bg-[#1e293b]/80 backdrop-blur p-4 mb-6">
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Vehicle</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-[#64748b] block">Carrier</span>
            <span className="text-white font-medium">{session.orgName}</span>
          </div>
          <div>
            <span className="text-[#64748b] block">DOT Number</span>
            <span className="text-white font-medium">{session.usdot ?? '—'}</span>
          </div>
          <div>
            <span className="text-[#64748b] block">VIN</span>
            <span className="text-white font-medium break-all">{session.vin ?? '—'}</span>
          </div>
          <div>
            <span className="text-[#64748b] block">Plate</span>
            <span className="text-white font-medium">{session.plate ?? session.vehicleName ?? '—'}</span>
          </div>
        </div>
      </section>

      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={() => setTransferOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
        >
          <Send className="size-5" />
          Transfer Logs to DOT
        </button>
      </div>

      {transferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" role="dialog" aria-labelledby="transfer-title">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e293b] p-6 shadow-xl">
            <h2 id="transfer-title" className="text-lg font-semibold text-white mb-4">Transfer Logs to DOT</h2>
            <p className="text-sm text-[#94a3b8] mb-4">Enter the officer&apos;s email or file transfer code. A PDF of the 8-day log will be sent immediately.</p>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Email</label>
                <input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="officer@dot.gov"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0f172a] border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Or File Transfer Code</label>
                <input
                  type="text"
                  value={transferCode}
                  onChange={(e) => setTransferCode(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0f172a] border border-white/10 text-white"
                />
              </div>
              {transferMessage && <p className="text-sm text-amber-400">{transferMessage}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={transferSending} className="flex-1 py-2.5 rounded-lg bg-amber-500 text-black font-semibold disabled:opacity-50">
                  {transferSending ? 'Sending…' : 'Send PDF'}
                </button>
                <button type="button" onClick={() => setTransferOpen(false)} className="px-4 py-2.5 rounded-lg border border-white/20 text-[#cbd5e1]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-[#1e293b]/80 backdrop-blur p-4 mb-6 overflow-x-auto">
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="size-4" />
          8-Day Log Grid (DOT Standard)
        </h2>
        <div className="space-y-4 min-w-[600px]">
          {session.hosLogs.length === 0 ? (
            <p className="text-[#94a3b8] text-sm py-4">HOS data is retrieved from the ELD. No log entries in this window or ELD not connected.</p>
          ) : (
            session.hosLogs.map((day) => (
              <div key={day.date} className="border border-white/10 rounded-lg p-3 bg-[#0f172a]/50">
                <p className="text-xs text-[#94a3b8] mb-2 font-medium">{day.date}</p>
                <div className="flex gap-px h-8 rounded overflow-hidden">
                  {(() => {
                    const hours = Array.from({ length: 24 }, (_, h) => h);
                    return hours.map((h) => {
                      const dayStart = new Date(day.date + 'T00:00:00').getTime();
                      const slotStart = dayStart + h * 3600000;
                      const slotEnd = slotStart + 3600000;
                      let type = 'off_duty';
                      for (const ev of day.events) {
                        const s = ev.startTime ? new Date(ev.startTime).getTime() : 0;
                        const e = ev.endTime ? new Date(ev.endTime).getTime() : 0;
                        if (e > slotStart && s < slotEnd) {
                          type = ev.type;
                          break;
                        }
                      }
                      return (
                        <div
                          key={h}
                          className={`flex-1 min-w-0 ${getStatusColor(type)}`}
                          title={`${h}:00–${h + 1}:00 ${type}`}
                        />
                      );
                    });
                  })()}
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  {['off_duty', 'sleeper', 'driving', 'on_duty'].map((t) => (
                    <span key={t} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded ${getStatusColor(t)}`} />
                      {t.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#1e293b]/80 backdrop-blur p-4 mb-6 overflow-x-auto">
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Log Events</h2>
        {allEvents.length === 0 ? (
          <p className="text-[#94a3b8] text-sm">No status change events in the last 8 days.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-[#64748b] border-b border-white/10">
                  <th className="pb-2 pr-4">Date / Time</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Location</th>
                  <th className="pb-2">Remark</th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map(({ date, event }, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-[#e2e8f0]">{date} {event.startTime?.slice(11, 19)}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(event.type)} text-white`}>
                        {event.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-[#94a3b8]">{event.location ?? '—'}</td>
                    <td className="py-2 text-[#94a3b8]">{event.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-[#1e293b]/80 backdrop-blur p-4">
        <button
          type="button"
          onClick={() => setShowCabCard(!showCabCard)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-amber-500/40 text-amber-400 font-medium hover:bg-amber-500/10 transition-colors"
        >
          <Shield className="size-5" />
          View ELD Cab Card
        </button>
        {showCabCard && (
          <div className="mt-4 p-4 rounded-lg bg-[#0f172a]/80 border border-white/10 text-center">
            <p className="text-[#94a3b8] text-sm mb-2">FMCSA-registered ELD — Certification on device</p>
            <p className="text-[#64748b] text-xs">
              The official ELD cab card is displayed on the in-cab device. This system (VantagFleet) syncs with Motive/Geotab ELDs that are FMCSA certified.
            </p>
            <p className="text-[#64748b] text-xs mt-2">
              For device-specific certification details, refer to the physical cab card in the vehicle or the ELD manufacturer.
            </p>
          </div>
        )}
      </section>

      <p className="text-center text-[#64748b] text-xs mt-8">Certified by VantagFleet · Read-only inspection view</p>
    </div>
  );
}
