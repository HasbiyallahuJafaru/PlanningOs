import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'PlanningOS',
  description: 'UK planning and permitting operations platform',
};

/**
 * Root layout. Required by the App Router and must render <html> and <body>.
 * `lang="en"` is set for accessibility/screen-reader correctness (WCAG 2.2 AA).
 */
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
