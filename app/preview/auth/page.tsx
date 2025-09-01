"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Monitor, Smartphone } from "lucide-react"

export default function AuthPreview() {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Preview</h1>
        <p className="text-muted-foreground text-center max-w-2xl mb-6">
          This page demonstrates how the authentication flow works in Tinerary. Users can browse without signing up, but
          need to authenticate to create or edit content.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={viewMode === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("desktop")}
          >
            <Monitor className="mr-2 h-4 w-4" />
            Desktop
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("mobile")}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Mobile
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className={`bg-background border rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
            viewMode === "desktop" ? "w-full max-w-5xl h-[600px]" : "w-[375px] h-[667px]"
          }`}
        >
          <div className="bg-muted p-2 flex items-center gap-2 border-b">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 text-center">
              <div className="bg-background/80 text-xs py-1 px-2 rounded-full inline-block">tinerary.app/auth</div>
            </div>
          </div>

          <div className="w-full h-[calc(100%-40px)]">
            <iframe src="/auth" className="w-full h-full border-0" title="Authentication Preview" />
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-2xl mx-auto">
        <Tabs defaultValue="features">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Key Features</TabsTrigger>
            <TabsTrigger value="flow">Auth Flow</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="p-4 border rounded-lg mt-2">
            <h3 className="text-lg font-medium mb-3">Key Features</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>Dual authentication methods: email and phone</li>
              <li>Clear separation between browsing and content creation</li>
              <li>Responsive design for all device sizes</li>
              <li>Engaging visuals with world map background</li>
              <li>Smooth transitions between authentication states</li>
              <li>Clear messaging about what users can do without signing up</li>
            </ul>
          </TabsContent>

          <TabsContent value="flow" className="p-4 border rounded-lg mt-2">
            <h3 className="text-lg font-medium mb-3">Authentication Flow</h3>
            <ol className="space-y-2 list-decimal pl-5">
              <li>User visits the site and can browse content freely</li>
              <li>When attempting to create/edit content, user is redirected to auth page</li>
              <li>User chooses between email or phone authentication</li>
              <li>For email: User enters credentials and receives verification email</li>
              <li>For phone: User enters phone number and receives SMS verification code</li>
              <li>After successful verification, user is redirected to the original page</li>
              <li>User can now create and edit content</li>
            </ol>
          </TabsContent>

          <TabsContent value="implementation" className="p-4 border rounded-lg mt-2">
            <h3 className="text-lg font-medium mb-3">Implementation Details</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>Supabase authentication for email/password</li>
              <li>Twilio integration for SMS verification</li>
              <li>Next.js middleware for route protection</li>
              <li>Server-side session validation</li>
              <li>Responsive UI with Tailwind CSS</li>
              <li>Form validation and error handling</li>
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
