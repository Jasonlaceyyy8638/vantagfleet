'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { PenLine, X, RotateCcw, Check } from 'lucide-react';

export function SignDailyLogButton() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [open, setOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, [getCtx]);

  useEffect(() => {
    if (open) clearCanvas();
  }, [open, clearCanvas]);

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      isDrawing.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      lastPos.current = {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx || !lastPos.current) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPos.current = { x, y };
    },
    [getCtx]
  );

  const endDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setMessage('');
    setSaved(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    const blankCtx = blank.getContext('2d');
    if (blankCtx) {
      blankCtx.fillStyle = '#1e293b';
      blankCtx.fillRect(0, 0, blank.width, blank.height);
    }
    if (dataUrl === blank.toDataURL('image/png')) {
      setMessage('Please draw your signature first.');
      return;
    }
    setSigning(true);
    setMessage('');
    try {
      const res = await fetch('/api/driver/roadside-shield/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'Failed to save signature');
        return;
      }
      setSaved(true);
      setTimeout(() => {
        setOpen(false);
      }, 1200);
    } finally {
      setSigning(false);
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="roadside-btn w-full rounded-lg border-2 border-amber-500/50 bg-amber-500/10 text-amber-400 font-semibold px-4 py-3 flex items-center justify-center gap-2"
      >
        <PenLine className="size-5" />
        Sign Daily Log
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-labelledby="sign-daily-log-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#0f172a] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 id="sign-daily-log-title" className="text-lg font-semibold text-white">
                Sign Daily Log
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="px-4 py-2 text-sm text-[#94a3b8]">
              Draw your signature below. It will be applied to the PDF logs sent to the officer.
            </p>
            <div className="px-4 pb-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={180}
                className="w-full max-w-full h-44 rounded-xl border-2 border-amber-500/40 bg-[#1e293b] touch-none cursor-crosshair"
                style={{ maxHeight: 180 }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button
                type="button"
                onClick={clearCanvas}
                className="flex-1 py-2.5 rounded-lg border border-white/20 text-[#cbd5e1] font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="size-4" />
                Clear
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={signing}
                className="flex-1 py-2.5 rounded-lg bg-[#f59e0b] text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {signing ? (
                  'Saving…'
                ) : saved ? (
                  <>
                    <Check className="size-5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Check className="size-5" />
                    Confirm
                  </>
                )}
              </button>
            </div>
            {message && (
              <p className="px-4 pb-4 text-sm text-amber-400">{message}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
