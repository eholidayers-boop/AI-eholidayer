import './globals.css';
import type { ReactNode } from 'react';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export const metadata = {
  title: 'eHolidayer — Your intelligent hotel companion',
  description: 'Tell us what you want. We will find the stay for you.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
