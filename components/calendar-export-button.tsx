"use client"

import { useState } from "react"
import { Calendar, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { exportEventToCalendar, getCalendarUrls, type CalendarEvent } from "@/lib/calendar-export-service"

interface CalendarExportButtonProps {
  event: CalendarEvent
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  showLabel?: boolean
}

export function CalendarExportButton({
  event,
  variant = "outline",
  size = "default",
  showLabel = true,
}: CalendarExportButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    const result = await exportEventToCalendar(event)

    if (result.success) {
      toast({
        title: "Exported!",
        description: "Event has been exported to your calendar",
      })
    } else {
      toast({
        title: "Export failed",
        description: result.error || "Failed to export event",
        variant: "destructive",
      })
    }

    setIsExporting(false)
  }

  const calendarUrls = getCalendarUrls(event)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          <Calendar className="h-4 w-4 mr-2" />
          {showLabel && (isExporting ? "Exporting..." : "Add to Calendar")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export to Calendar</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Download .ics file
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href={calendarUrls.google} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Google Calendar
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href={calendarUrls.outlook} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Outlook Calendar
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Apple Calendar
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Other Calendar Apps
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simplified button that just downloads .ics file
export function QuickCalendarExportButton({
  event,
  variant = "outline",
  size = "sm",
}: {
  event: CalendarEvent
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
}) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    const result = await exportEventToCalendar(event)

    if (result.success) {
      toast({
        title: "Exported!",
        description: "Event has been exported to your calendar",
      })
    } else {
      toast({
        title: "Export failed",
        description: result.error || "Failed to export event",
        variant: "destructive",
      })
    }

    setIsExporting(false)
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport} disabled={isExporting}>
      <Calendar className="h-4 w-4 mr-2" />
      {isExporting ? "Exporting..." : "Export"}
    </Button>
  )
}
