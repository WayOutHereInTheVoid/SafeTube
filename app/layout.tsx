import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

/**
 * Metadata for the SafeTube application.
 */
export const metadata: Metadata = {
  title: 'SafeTube',
  description: 'Parent-controlled YouTube player',
}

/**
 * Root layout component for the entire application.
 *
 * @param props - Component properties.
 * @param props.children - The content to be rendered within the body.
 * @returns The HTML document structure with global styles and fonts.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
