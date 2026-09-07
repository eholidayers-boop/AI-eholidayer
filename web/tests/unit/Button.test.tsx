import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Find hotels</Button>);
    expect(screen.getByRole('button', { name: 'Find hotels' })).toBeInTheDocument();
  });

  it('applies variant and size classes', () => {
    render(<Button variant="secondary" size="lg">Go</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/secondary/);
    expect(btn.className).toMatch(/lg/);
  });

  it('shows loading state and is disabled', () => {
    render(<Button loading>Go</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
