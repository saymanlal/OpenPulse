import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'OpenPulse',
  description: 'Analyze a GitHub repository and inspect its dependency graph in a responsive 3D view.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
