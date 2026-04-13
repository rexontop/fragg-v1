import type { Metadata, Viewport } from "next"
import { DM_Sans, Rajdhani, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
})

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  title: "FRAGG.GG - CS2 Community Platform",
  description:
    "Track your CS2 stats, compete on leaderboards, and dominate the competition. The CS2 community built for players who actually play.",
  keywords: ["CS2", "Counter-Strike 2", "esports", "leaderboard", "stats", "gaming"],
  openGraph: {
    title: "FRAGG.GG - CS2 Community Platform",
    description: "Track. Compete. Dominate. The CS2 community built for players who actually play.",
    type: "website",
    siteName: "FRAGG.GG",
  },
  twitter: {
    card: "summary_large_image",
    title: "FRAGG.GG - CS2 Community Platform",
    description: "Track. Compete. Dominate.",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#0a0a0c]">
      <body
        className={`${dmSans.variable} ${rajdhani.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}
      >
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
