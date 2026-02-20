import type React from "react"
import "@/app/globals.css"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/providers/auth-provider"
import { ConsentProvider } from "@/providers/consent-provider"
import { OnboardingWrapper } from "@/components/onboarding-wrapper"
import { GlobalErrorHandler } from "@/components/global-error-handler"
import { I18nProvider } from "@/providers/i18n-provider"
import { PWARegister } from "@/components/pwa-register"

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E11D48',
}

export const metadata: Metadata = {
  title: "Tinerary",
  description: "Create and share your travel itineraries",
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/Tinerary_icon.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tinerary',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts for customizable itinerary fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <I18nProvider>
              <GlobalErrorHandler>
                <ConsentProvider>
                  <OnboardingWrapper>
                    {children}
                  </OnboardingWrapper>
                </ConsentProvider>
              </GlobalErrorHandler>
              <Toaster />
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
        <PWARegister />
      </body>
    </html>
  )
}
