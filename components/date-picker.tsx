"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  /** Controlled value. Omit to let the picker hold its own state. */
  date?: Date
  /** Controlled setter. Required for the parent to observe selection. */
  setDate?: React.Dispatch<React.SetStateAction<Date | undefined>>
}

/**
 * Works controlled or uncontrolled.
 *
 * It previously took no props at all while callers passed `date`/`setDate`,
 * so a parent could never observe the selection — promotion-booking-panel
 * read a date the user's click never reached.
 */
export function DatePicker({ date: dateProp, setDate: setDateProp }: DatePickerProps = {}) {
  const [internalDate, setInternalDate] = React.useState<Date>()
  const date = dateProp !== undefined ? dateProp : internalDate
  const setDate = setDateProp ?? setInternalDate

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  )
}
