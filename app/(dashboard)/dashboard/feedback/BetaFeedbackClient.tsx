'use client';

import { useState } from 'react';
import { submitBugReport } from '@/app/actions/beta-feedback';
import {
  ClipboardCheck,
  Fuel,
  DollarSign,
  FileCheck,
  CreditCard,
  AlertCircle,
  Upload,
  Send,
} from 'lucide-react';

const TASKS = [
  {
    id: '1',
    title: 'The "One-Click" Fleet Setup',
    goal: 'Add your trucks using only the VIN.',
    test: 'Enter a 17-digit VIN. Does the Year, Make, and Model auto-fill correctly?',
    watch: 'Does it recognize "Class 8" (Semi) trucks? If the API fails, is the "Manual Entry" button visible and working?',
    errorReport: 'If the truck info is wrong, take a screenshot of the VIN and the incorrect data.',
    icon: ClipboardCheck,
  },
  {
    id: '2',
    title: 'AI Fuel Receipt Scanning',
    goal: 'Upload a blurry or crumpled fuel receipt and have the AI "read" it.',
    test: 'Go to the Fuel section and upload a photo. Does it correctly pull the Gallons, State, and Total Cost?',
    watch: 'Does it get the State (OH, IN, etc.) right? This is critical for IFTA.',
    errorReport: 'If the AI misses a number or gets the state wrong, send a screenshot of the receipt and the AI\'s output.',
    icon: Fuel,
  },
  {
    id: '3',
    title: 'Load Profitability & IFTA',
    goal: 'Ensure the "Profit per Mile" math is actually helping you make decisions.',
    test: 'Enter a load (Revenue, Total Miles, Fuel). Does the math match your manual calculations?',
    watch: 'Add a "State Breakdown" (e.g., 100 miles in OH, 50 in IN). Does the IFTA Quarterly Summary update immediately?',
    errorReport: 'If the "Profit per Mile" looks weird or the State Miles don\'t add up, let us know.',
    icon: DollarSign,
  },
  {
    id: '4',
    title: 'Compliance "Auto-Auditor"',
    goal: 'Have the AI verify your Insurance (COI).',
    test: 'Upload a Certificate of Insurance.',
    watch: 'Does the dashboard show your Expiration Date and Liability Limits correctly? Does it turn "Red" if the policy is expired?',
    errorReport: 'Screenshot any "False Alarms" (e.g., the AI saying you\'re non-compliant when you are).',
    icon: FileCheck,
  },
  {
    id: '5',
    title: 'The "Founder" Checkout',
    goal: 'Verify the 20% Lifetime Discount.',
    test: 'Click the "Claim Lifetime Discount" banner.',
    watch: 'On the Stripe page, do you see the 20% Beta Founder Discount applied automatically?',
    errorReport: 'If the price shows the full "Retail" amount, STOP and do not pay. Send a screenshot of the checkout screen.',
    icon: CreditCard,
  },
];

export function BetaFeedbackClient() {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [device, setDevice] = useState('');
  const [action, setAction] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('description', description);
      if (taskName) formData.set('task_name', taskName);
      if (device) formData.set('device', device);
      if (action) formData.set('action', action);
      if (screenshot) formData.set('screenshot', screenshot);
      const result = await submitBugReport(formData);
      if (result.ok) {
        setMessage({ type: 'success', text: 'Report sent. Thank you!' });
        setDescription('');
        setDevice('');
        setAction('');
        setScreenshot(null);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        {TASKS.map((task) => {
          const Icon = task.icon;
          return (
            <div
              key={task.id}
              className="rounded-xl border border-white/10 bg-card/50 p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Icon className="size-5 text-cyber-amber" />
                <h2 className="font-semibold text-soft-cloud">{task.id}. {task.title}</h2>
              </div>
              <p className="text-sm text-soft-cloud/80">
                <span className="font-medium text-cyber-amber/90">The Goal:</span> {task.goal}
              </p>
              <p className="text-sm text-soft-cloud/80">
                <span className="font-medium text-cyber-amber/90">The Test:</span> {task.test}
              </p>
              <p className="text-sm text-soft-cloud/80">
                <span className="font-medium text-cyber-amber/90">What to watch for:</span> {task.watch}
              </p>
              <p className="text-sm text-soft-cloud/70 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-cyber-amber" />
                <span><strong>Error Reporting:</strong> {task.errorReport}</span>
              </p>
            </div>
          );
        })}
      </section>

      <section className="rounded-xl border border-cyber-amber/30 bg-cyber-amber/5 p-6">
        <h2 className="font-semibold text-soft-cloud mb-1 flex items-center gap-2">
          <Upload className="size-5 text-cyber-amber" />
          Report a Bug
        </h2>
        <p className="text-sm text-soft-cloud/70 mb-4">
          Send a screenshot and description so we can fix things fast.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task_name" className="block text-sm font-medium text-soft-cloud/80 mb-1">
              Which task? (optional)
            </label>
            <select
              id="task_name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
            >
              <option value="">— Select task —</option>
              {TASKS.map((t) => (
                <option key={t.id} value={t.id}>{t.id}. {t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-soft-cloud/80 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="What went wrong? What did you expect?"
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/40"
            />
          </div>
          <div>
            <label htmlFor="device" className="block text-sm font-medium text-soft-cloud/80 mb-1">
              Device (e.g. iPhone Safari, Dell laptop)
            </label>
            <input
              id="device"
              type="text"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              placeholder="iPhone using Safari"
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/40"
            />
          </div>
          <div>
            <label htmlFor="action" className="block text-sm font-medium text-soft-cloud/80 mb-1">
              What were you doing?
            </label>
            <input
              id="action"
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Trying to add a trailer when the screen went white"
              className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-soft-cloud/80 mb-1">
              Screenshot (optional, max 10MB)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-soft-cloud/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-cyber-amber/20 file:text-cyber-amber"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send Report'}
            <Send className="size-4" />
          </button>
        </form>
        <p className="mt-3 text-xs text-soft-cloud/50">
          Reports are saved to our bug tracker so we can track and fix issues. You can also email us at feedback@vantagfleet.com with the same details.
        </p>
      </section>
    </div>
  );
}
