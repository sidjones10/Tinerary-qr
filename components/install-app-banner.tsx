"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Smartphone, Share, PlusSquare, MoreVertical, Download } from "lucide-react"
import { useTranslation } from "react-i18next"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallAppBanner() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone)
    setIsStandalone(!!standalone)

    // Detect iOS
    const ua = window.navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window)
    setIsIOS(ios)

    // Listen for the install prompt (Android / Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (isStandalone) return null

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 p-8 rounded-lg text-center">
      <div className="flex justify-center mb-4">
        <Smartphone className="h-10 w-10 text-purple-600 dark:text-purple-400" />
      </div>
      <h3 className="text-2xl font-semibold mb-4">{t("home.installApp")}</h3>
      <p className="mb-6">{t("home.installAppDescription")}</p>

      {/* Android / Chrome install button */}
      {deferredPrompt && (
        <Button size="lg" onClick={handleInstallClick} className="gap-2">
          <Download className="h-5 w-5" />
          {t("home.installNow")}
        </Button>
      )}

      {/* iOS instructions */}
      {isIOS && !deferredPrompt && (
        <div>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowIOSInstructions((v) => !v)}
            className="gap-2"
          >
            <Download className="h-5 w-5" />
            {t("home.installOnIphone")}
          </Button>
          {showIOSInstructions && (
            <div className="mt-4 text-left max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <p className="font-medium mb-3">{t("home.iosSteps")}</p>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="font-semibold">1.</span>
                  {t("home.iosStep1")}
                  <Share className="h-4 w-4 inline-block text-blue-500 shrink-0" />
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold">2.</span>
                  {t("home.iosStep2")}
                  <PlusSquare className="h-4 w-4 inline-block text-gray-600 dark:text-gray-400 shrink-0" />
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">3.</span>
                  {t("home.iosStep3")}
                </li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Fallback for desktop / other browsers */}
      {!deferredPrompt && !isIOS && (
        <div>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowIOSInstructions((v) => !v)}
            className="gap-2"
          >
            <Download className="h-5 w-5" />
            {t("home.installOnDevice")}
          </Button>
          {showIOSInstructions && (
            <div className="mt-4 text-left max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <p className="font-medium mb-3">{t("home.browserSteps")}</p>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="font-semibold">1.</span>
                  {t("home.browserStep1")}
                  <MoreVertical className="h-4 w-4 inline-block text-gray-600 dark:text-gray-400 shrink-0" />
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">2.</span>
                  {t("home.browserStep2")}
                </li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
