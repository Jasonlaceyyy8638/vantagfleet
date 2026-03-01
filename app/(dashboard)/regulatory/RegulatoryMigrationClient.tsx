'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, RefreshCw } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

type Props = {
  usdotNumber: string | null;
  predictedBasicScore: number;
};

const STEPS = [
  { title: 'MC numbers', body: 'Enter any Motor Carrier (MC) numbers you currently use. We\'ll associate them with your USDOT for the new standard.' },
  { title: 'Link to USDOT', body: 'Your documentation will be updated to the USDOT-only standard. Your MC number(s) will remain on file for reference.' },
  { title: 'Complete', body: 'You\'re now using the USDOT-only standard. Update any external systems or partners with your USDOT if needed.' },
];

export function RegulatoryMigrationClient({ usdotNumber, predictedBasicScore }: Props) {
  const [step, setStep] = useState(0);
  const [mcNumbers, setMcNumbers] = useState('');
  const [motusSyncing, setMotusSyncing] = useState(false);
  const [motusMessage, setMotusMessage] = useState('');

  const handleMotusSync = () => {
    setMotusSyncing(true);
    setMotusMessage('');
    setTimeout(() => {
      setMotusSyncing(false);
      setMotusMessage('FMCSA Motus API integration coming soon. This button is a placeholder.');
    }, 1200);
  };

  const scoreColor = predictedBasicScore >= 80 ? '#00F5D4' : predictedBasicScore >= 50 ? '#FFB000' : '#f87171';
  const gaugeData = [{ name: 'BASICs', value: predictedBasicScore, fill: scoreColor }];

  return (
    <div className="space-y-8">
      {/* MC to DOT wizard */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-1">MC to DOT migration</h2>
        <p className="text-sm text-soft-cloud/70 mb-6">Update your documentation from MC numbers to the USDOT-only standard.</p>

        <div className="flex items-center gap-2 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-electric-teal' : 'bg-white/10'}`}
              aria-hidden
            />
          ))}
        </div>

        <div className="min-h-[120px]">
          <h3 className="font-medium text-soft-cloud mb-2">{STEPS[step].title}</h3>
          <p className="text-sm text-soft-cloud/70 mb-4">{STEPS[step].body}</p>

          {step === 0 && (
            <div>
              <label className="block text-xs font-medium text-soft-cloud/70 mb-1">MC number(s), comma-separated</label>
              <input
                type="text"
                value={mcNumbers}
                onChange={(e) => setMcNumbers(e.target.value)}
                placeholder="e.g. 123456, 789012"
                className="w-full max-w-sm px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm"
              />
            </div>
          )}
          {step === 1 && usdotNumber && (
            <p className="text-sm text-electric-teal">Your USDOT: <strong>{usdotNumber}</strong></p>
          )}
          {step === 2 && (
            <div className="flex items-center gap-2 text-electric-teal">
              <Check className="size-5" />
              <span className="text-sm font-medium">Migration complete</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-white/20 text-soft-cloud text-sm"
            >
              <ChevronLeft className="size-4" /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-medium text-sm"
            >
              Next <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-white/20 text-soft-cloud text-sm"
            >
              Start over
            </button>
          )}
        </div>
      </section>

      {/* Motus Sync */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-1">Motus sync</h2>
        <p className="text-sm text-soft-cloud/70 mb-4">Pull carrier data from FMCSA Motus. (Placeholder for API.)</p>
        <button
          type="button"
          onClick={handleMotusSync}
          disabled={motusSyncing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-medium text-sm disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${motusSyncing ? 'animate-spin' : ''}`} />
          Sync with FMCSA Motus
        </button>
        {motusMessage && <p className="mt-3 text-sm text-soft-cloud/70">{motusMessage}</p>}
      </section>

      {/* CSA Safety Score Predictor */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-1">Safety score predictor</h2>
        <p className="text-sm text-soft-cloud/70 mb-6">Predicted BASICS score based on inspection data (mock).</p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-full sm:w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background={{ fill: 'rgba(255,255,255,0.1)' }}
                  dataKey="value"
                  cornerRadius={8}
                  max={100}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-soft-cloud">{predictedBasicScore}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-soft-cloud/80">
              This gauge uses mock inspection and defect data from your database to estimate a BASICS-style safety score (0–100).
            </p>
            <p className="text-xs text-soft-cloud/50 mt-2">
              Higher is better. Replace with real CSA/BASICs API when available.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
