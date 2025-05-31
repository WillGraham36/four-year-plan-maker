"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ACCEPTABLE_ULC_AREAS } from "@/lib/utils/types"

interface ULCComboboxProps {
  value: string
  setValueStateAction: React.Dispatch<React.SetStateAction<string>>
}

export function ULCCombobox({
  value,
  setValueStateAction,
}: ULCComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="text-sm"
        >
          {value
            ? ACCEPTABLE_ULC_AREAS.find((area) => area === value)
            : "Select area..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 mr-7 p-0 border-border">
        <Command>
          <CommandInput placeholder="Search areas..." />
          <CommandList className="bg-popover">
            <CommandEmpty>Area not found</CommandEmpty>
            <CommandGroup>
              {ACCEPTABLE_ULC_AREAS.map((area) => (
                <CommandItem
                  key={area}
                  value={area}
                  onSelect={(currentValue) => {
                    setValueStateAction(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === area ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {area}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}