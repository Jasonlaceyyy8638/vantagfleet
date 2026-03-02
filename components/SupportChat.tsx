'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getSupportMessages, sendSupportMessage } from '@/app/actions/support-chat';

type Message = { id: string; sender_id: string; receiver_id: string | null; org_id: string; content: string; created_at: string };

function playPing() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // ignore
  }
}

function showDesktopNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((p) => {
      if (p === 'granted') new Notification(title, { body });
    });
  }
}

export function SupportChat() {
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    fetch('/api/support-chat-eligible')
      .then((r) => r.json())
      .then((d) => setEligible(!!d.eligible))
      .catch(() => setEligible(false));
  }, []);

  const loadOrgAndUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const getCookie = (name: string) => {
      const c = document.cookie.split('; ').find((s) => s.startsWith(name + '='));
      return c ? decodeURIComponent(c.split('=')[1] ?? '').trim() : null;
    };
    const id = getCookie('impersonated_org_id') || getCookie('vantag-current-org-id');
    if (id) setOrgId(id);
    else {
      const { data: profiles } = await supabase.from('profiles').select('org_id').eq('user_id', user.id);
      const first = (profiles ?? []).find((p) => p.org_id);
      if (first?.org_id) setOrgId(first.org_id);
    }
  }, [supabase]);

  useEffect(() => {
    if (eligible !== true) return;
    loadOrgAndUser();
  }, [eligible, loadOrgAndUser]);

  const loadMessages = useCallback(async (oid: string) => {
    setLoading(true);
    const list = await getSupportMessages(oid);
    setMessages(list as Message[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!orgId || !open) return;
    loadMessages(orgId);
  }, [orgId, open, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!orgId || eligible !== true) return;
    const channel = supabase
      .channel(`support_messages:${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `org_id=eq.${orgId}` },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())));
          if (row.sender_id !== userId) {
            playPing();
            if (typeof document !== 'undefined' && document.hidden) {
              showDesktopNotification('VantagFleet Support', row.content.slice(0, 80) + (row.content.length > 80 ? '…' : ''));
            }
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [orgId, userId, supabase, eligible]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !input.trim() || sending) return;
    setSending(true);
    const result = await sendSupportMessage(orgId, input.trim(), null);
    setSending(false);
    if ('ok' in result) {
      setInput('');
    }
  };

  if (eligible !== true) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-24 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyber-amber/60 bg-midnight-ink text-cyber-amber shadow-lg hover:bg-cyber-amber/10 transition-all hover:scale-105"
        aria-label="Support chat"
      >
        <MessageCircle className="size-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col w-[380px] max-h-[520px] rounded-xl border border-cyber-amber/30 bg-midnight-ink shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-amber/20 bg-cyber-amber/5">
            <span className="font-semibold text-cyber-amber">Support Chat</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-soft-cloud/70 hover:text-cyber-amber hover:bg-cyber-amber/10"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-[240px] p-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-cyber-amber" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-soft-cloud/50 text-center py-6">No messages yet. Say hi and we’ll reply shortly.</p>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === userId;
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        isMe ? 'bg-cyber-amber/20 text-soft-cloud' : 'bg-white/10 text-soft-cloud'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-cyber-amber/80' : 'text-soft-cloud/50'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-cyber-amber/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 px-3 py-2 rounded-lg bg-midnight-ink border border-cyber-amber/30 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber/50"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="p-2 rounded-lg bg-cyber-amber text-midnight-ink hover:bg-cyber-amber/90 disabled:opacity-50"
              >
                {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
