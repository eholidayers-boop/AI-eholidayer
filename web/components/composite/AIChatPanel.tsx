'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HotelCard } from '@/components/composite/HotelCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Hotel } from '@/lib/inventory/types';
import { trackEvent } from '@/lib/analytics/client';

type ChatState = { role: 'user' | 'assistant'; content: string; hotels?: Hotel[] };

export function AIChatPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatState[]>([]);
  const [streaming, setStreaming] = useState(false);

  async function send() {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setStreaming(true);
    setMessages(m => [...m, { role: 'assistant', content: '' }]);
    trackEvent('chat_started', { length: userMsg.length });

    const res = await fetch('/api/ai/converse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let asstText = '';
    let asstHotels: Hotel[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const [eventLine, dataLine] = part.split('\n');
        const event = eventLine?.replace('event: ', '');
        const data = JSON.parse((dataLine ?? '').replace('data: ', ''));
        if (event === 'text_delta') {
          asstText += data.text;
          setMessages(m => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'assistant', content: asstText };
            return copy;
          });
        } else if (event === 'hotels' && Array.isArray(data.hotels)) {
          asstHotels = data.hotels;
          setMessages(m => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'assistant', content: asstText, hotels: asstHotels };
            return copy;
          });
        }
      }
    }
    setStreaming(false);
    trackEvent('chat_completed', { toolCalls: asstHotels.length > 0 ? 1 : 0 });
  }

  return (
    <div className="mx-auto max-w-3xl w-full">
      <ul className="space-y-3 mb-4" aria-live="polite">
        {messages.map((m, i) => (
          <li key={i} className={`p-3 rounded-md ${m.role === 'user' ? 'bg-accent-soft' : 'bg-bg-subtle'}`}>
            <span className="whitespace-pre-wrap">{m.content || <Skeleton className="h-4 w-32 inline-block" />}</span>
            {m.hotels && m.hotels.length > 0 && (
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {m.hotels.map(h => <li key={h.id}><HotelCard hotel={h} /></li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <Input
          variant="chat"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me what kind of stay you're looking for..."
          aria-label="Describe your ideal stay"
          disabled={streaming}
        />
        <Button type="submit" size="lg" loading={streaming}>Find</Button>
      </form>
    </div>
  );
}
