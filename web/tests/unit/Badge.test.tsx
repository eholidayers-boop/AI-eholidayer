import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders with score styling for matchScore variant', () => {
    render(<Badge variant="matchScore" score={92}>92% Match</Badge>);
    expect(screen.getByText('92% Match').className).toMatch(/matchScore/);
  });

  it('uses neutral tone when score < 60', () => {
    render(<Badge variant="matchScore" score={40}>40%</Badge>);
    expect(screen.getByText('40%').className).toMatch(/neutral/);
  });

  it('uses success tone when score >= 80', () => {
    render(<Badge variant="matchScore" score={85}>85%</Badge>);
    expect(screen.getByText('85%').className).toMatch(/success/);
  });
});
