'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { Send, X, MessageCircle } from 'lucide-react';

interface Message {
  id: number;
  order_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  orderId: number;
  counterpartName: string;
  onClose: () => void;
}

export function ChatWindow({ orderId, counterpartName, onClose }: ChatWindowProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?order_id=${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch { /* silent */ }
  }, [orderId, token]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: orderId, content: input.trim() }),
      });
      setInput('');
      await fetchMessages();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden" style={{ height: '420px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-wood" />
          <span className="text-sm font-medium text-primary">與 {counterpartName} 的對話</span>
        </div>
        <button onClick={onClose} className="text-subtle hover:text-muted transition-colors p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-subtle text-xs pt-4">目前沒有訊息，開始對話吧！</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                isMine
                  ? 'bg-wood text-white rounded-br-sm'
                  : 'bg-surface text-primary rounded-bl-sm'
              }`}>
                {!isMine && (
                  <p className="text-[10px] text-muted mb-0.5">{msg.sender_name}</p>
                )}
                <p className="leading-relaxed break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-subtle'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入訊息..."
          maxLength={500}
          className="flex-1 bg-surface border border-border rounded-full px-3 py-1.5 text-sm text-primary placeholder:text-subtle focus:outline-none focus:border-wood transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-8 h-8 bg-wood hover:bg-wood-h disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
