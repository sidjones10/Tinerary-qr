"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Users, Video, MapPin } from "lucide-react"

export default function HelpResourcesPage() {
  const { t } = useTranslation()

  const resources = [
    {
      icon: <FileText className="h-5 w-5" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      title: t("settings.help.userGuide"),
      description: t("settings.help.userGuideDesc"),
    },
    {
      icon: <Users className="h-5 w-5" />,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      title: t("settings.help.communityForum"),
      description: t("settings.help.communityForumDesc"),
    },
    {
      icon: <Video className="h-5 w-5" />,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      title: t("settings.help.videoTutorials"),
      description: t("settings.help.videoTutorialsDesc"),
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      title: t("settings.help.travelTips"),
      description: t("settings.help.travelTipsDesc"),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <header className="bg-white dark:bg-card shadow-sm py-4 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{t("settings.help.helpResources")}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.help.helpResources")}</CardTitle>
            <CardDescription>{t("settings.help.helpResourcesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="border rounded-md p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className={`${resource.iconBg} ${resource.iconColor} p-2 rounded-md`}>
                    {resource.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
