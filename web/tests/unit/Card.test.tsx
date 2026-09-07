import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children inside an article', () => {
    render(<Card>Body</Card>);
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Card variant="bordered">X</Card>);
    const article = screen.getByText('X').closest('article');
    expect(article?.getAttribute('data-variant')).toBe('bordered');
    expect(article?.className).toMatch(/border/);
  });
});
