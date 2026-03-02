'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, MessageCircle, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getSupportConversations, getSupportMessages, sendSupportMessage } from '@/app/actions/support-chat';
import type { SupportMessageRow, SupportConversationRow } from '@/lib/admin-types';

type Message = SupportMessageRow;

export function AdminSupportChatClient() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<SupportConversationRow[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, [supabase]);

  const loadConversations = useCallback(async () => {
    setLoadingConvos(true);
    const list = await getSupportConversations();
    setConversations(list);
    setLoadingConvos(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (orgId: string) => {
    setLoadingMessages(true);
    const list = await getSupportMessages(orgId);
    setMessages(list);
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (!selectedOrgId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedOrgId);
  }, [selectedOrgId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selectedOrgId) return;
    const channel = supabase
      .channel(`admin_support:${selectedOrgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `org_id=eq.${selectedOrgId}` },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          );
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedOrgId, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !input.trim() || sending) return;
    setSending(true);
    await sendSupportMessage(selectedOrgId, input.trim(), null);
    setSending(false);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/admin/support"
          className="p-2 rounded-lg border border-white/10 text-soft-cloud hover:bg-white/5"
          aria-label="Back to support"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-cyber-amber" />
          <h1 className="text-xl font-bold text-soft-cloud">Live Chat</h1>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 rounded-xl border border-white/10 bg-card overflow-hidden">
        <aside className="w-72 border-r border-white/10 flex flex-col bg-midnight-ink/50">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold text-cyber-amber uppercase tracking-wider">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-cyber-amber" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-soft-cloud/50 p-4">No conversations yet.</p>
            ) : (
              <ul className="p-2 space-y-0.5">
                {conversations.map((c) => (
                  <li key={c.org_id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrgId(c.org_id);
                        setSelectedOrgName(c.org_name);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedOrgId === c.org_id
                          ? 'bg-cyber-amber/20 text-cyber-amber'
                          : 'text-soft-cloud/80 hover:bg-white/5 hover:text-soft-cloud'
                      }`}
                    >
                      <p className="font-medium truncate">{c.org_name}</p>
                      <p className="text-xs text-soft-cloud/50 truncate mt-0.5">{c.last_preview ?? 'No messages'}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {!selectedOrgId ? (
            <div className="flex-1 flex items-center justify-center text-soft-cloud/50">
              Select a conversation or wait for a carrier to message.
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-white/10 bg-cyber-amber/5 flex items-center justify-between gap-2">
                <p className="font-semibold text-soft-cloud truncate">{selectedOrgName}</p>
                <button
                  type="button"
                  onClick={() => {
                    document.cookie = `impersonated_org_id=${encodeURIComponent(selectedOrgId)}; path=/; max-age=3600`;
                    window.open('/dashboard', '_blank', 'noopener,noreferrer');
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-cyber-amber/20 text-cyber-amber hover:bg-cyber-amber/30 transition-colors"
                  title="Open this carrier's dashboard in a new tab (impersonation)"
                >
                  <ExternalLink className="size-3.5" />
                  Jump to User Dashboard
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-cyber-amber" />
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === userId;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            isMe ? 'bg-cyber-amber/20 text-soft-cloud' : 'bg-white/10 text-soft-cloud'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-cyber-amber/80' : 'text-soft-cloud/50'}`}>
                            {new Date(m.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Reply to carrier…"
                    className="flex-1 px-3 py-2 rounded-lg bg-midnight-ink border border-cyber-amber/30 text-soft-cloud placeholder-soft-cloud/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber/50"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-medium hover:bg-cyber-amber/90 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
