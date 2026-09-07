import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders with type=text by default', () => {
    render(<Input placeholder="Where to?" />);
    expect(screen.getByPlaceholderText('Where to?')).toHaveAttribute('type', 'text');
  });

  it('forwards aria-describedby for errors and hints', () => {
    render(<Input error="Required" hint="Optional hint" aria-label="Search" />);
    const input = screen.getByLabelText('Search');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('applies chat variant classes', () => {
    render(<Input variant="chat" placeholder="msg" />);
    const input = screen.getByPlaceholderText('msg');
    expect(input.className).toMatch(/chat/);
  });
});
