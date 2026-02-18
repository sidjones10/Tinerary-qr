"use client"

import { useState } from "react"
import { Download, Share2, Printer, Mail, Smartphone, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DownloadItineraryButtonProps {
  eventId: string
  eventTitle: string
}

export function DownloadItineraryButton({ eventId, eventTitle }: DownloadItineraryButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleDownload = (format: string) => {
    setIsGenerating(true)

    // Simulate download generation
    setTimeout(() => {
      setIsGenerating(false)
      setShowDialog(true)
    }, 1500)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gradient-to-r from-[#FF9B7D] to-[#FF5F6D] hover:opacity-90 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Itinerary
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDownload("pdf")} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            <span>PDF Document</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload("print")} className="cursor-pointer">
            <Printer className="h-4 w-4 mr-2" />
            <span>Print Version</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload("email")} className="cursor-pointer">
            <Mail className="h-4 w-4 mr-2" />
            <span>Email to Myself</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload("mobile")} className="cursor-pointer">
            <Smartphone className="h-4 w-4 mr-2" />
            <span>Mobile Version</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDownload("share")} className="cursor-pointer">
            <Share2 className="h-4 w-4 mr-2" />
            <span>Share with Friends</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your itinerary is ready!</DialogTitle>
          </DialogHeader>
          <div className="p-6 flex flex-col items-center">
            <div className="w-32 h-32 mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF9B7D] to-[#FF5F6D] rounded-lg shadow-lg animate-pulse"></div>
              <div className="absolute inset-2 bg-white dark:bg-card rounded-lg flex items-center justify-center">
                <FileText className="h-16 w-16 text-[#FF9B7D]" />
              </div>
            </div>
            <h3 className="text-lg font-bold mb-1">{eventTitle}</h3>
            <p className="text-sm text-gray-500 mb-6">Your itinerary has been generated successfully!</p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button className="bg-gradient-to-r from-[#FF9B7D] to-[#FF5F6D] hover:opacity-90 text-white">
                Download Now
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
