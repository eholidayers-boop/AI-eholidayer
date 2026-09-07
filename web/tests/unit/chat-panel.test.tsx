import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIChatPanel } from '@/components/composite/AIChatPanel';

global.fetch = vi.fn().mockResolvedValue({
  body: new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode('event: text_delta\ndata: {"text":"Hello"}\n\n'));
      c.enqueue(new TextEncoder().encode('event: hotels\ndata: {"hotels":[]}\n\n'));
      c.enqueue(new TextEncoder().encode('event: done\ndata: {}\n\n'));
      c.close();
    }
  })
} as any);

describe('AIChatPanel', () => {
  it('renders streamed assistant text', async () => {
    render(<AIChatPanel />);
    const input = screen.getByLabelText(/describe your ideal stay/i);
    fireEvent.change(input, { target: { value: 'Beach in Hurghada' } });
    fireEvent.click(screen.getByText(/find/i));
    await waitFor(() => expect(screen.getByText(/Hello/)).toBeInTheDocument());
  });
});
