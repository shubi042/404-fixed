import type React from "react"
import type { Metadata } from "next"
import type { Viewport } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
})

export const metadata: Metadata = {
  title: "TidyMate - Professional Cleaning Services in Toronto | Airbnb & Post-Construction",
  description:
    "Professional cleaning services in Toronto. Airbnb cleaning, post-construction cleanup, residential & commercial. Book online with transparent pricing. Fully insured.",
  keywords:
    "cleaning services Toronto, Airbnb cleaning, post-construction cleaning, residential cleaning, commercial cleaning, professional cleaners",
  authors: [{ name: "TidyMate" }],
  creator: "TidyMate",
  publisher: "TidyMate",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://tidymate.ca"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TidyMate - Professional Cleaning Services in Toronto",
    description:
      "Professional cleaning services for Airbnb, post-construction, residential & commercial properties. Book online with transparent pricing.",
    url: "https://tidymate.ca",
    siteName: "TidyMate",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TidyMate - Professional Cleaning Services",
    description: "Professional cleaning services in Toronto. Book online with transparent pricing.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} antialiased`}>
      <body>{children}</body>
    </html>
  )
}
