import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenPulse - 3D Intelligence Platform',
  description: 'Interactive 3D visualization of complex system relationships',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}