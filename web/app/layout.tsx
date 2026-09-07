import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'eHolidayer — Your intelligent hotel companion',
  description: 'Tell us what you want. We will find the stay for you.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
