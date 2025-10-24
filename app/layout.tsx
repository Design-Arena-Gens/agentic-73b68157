import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News Video Maker',
  description: 'Generate videos from news articles',
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
