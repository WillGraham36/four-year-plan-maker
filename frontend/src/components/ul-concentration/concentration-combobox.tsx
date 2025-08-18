"use client"
import { CheckIcon, ChevronDown } from "lucide-react"

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
import { ACCEPTABLE_ULC_AREAS, ACCEPTABLE_ULC_AREAS_SET } from "@/lib/utils/types"
import { useEffect, useState } from "react"

interface ULCComboboxProps {
  value: string
  setValueStateAction: React.Dispatch<React.SetStateAction<string>>
}

export function ULCCombobox({
  value,
  setValueStateAction,
}: ULCComboboxProps) {
  const previewOptions = ACCEPTABLE_ULC_AREAS.slice(0, 12); // show only 12 options at first

  const [open, setOpen] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState(previewOptions);

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        setVisibleOptions(ACCEPTABLE_ULC_AREAS); // show full list
      }, 0);
  
      return () => clearTimeout(timeout);
    } else {
      setVisibleOptions(previewOptions); // reset if closed
    }
  }, [open, ACCEPTABLE_ULC_AREAS]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`text-sm ${(value && ACCEPTABLE_ULC_AREAS_SET[value]) ? "" : "text-muted-foreground"}`}
        >
          {value
            ? (ACCEPTABLE_ULC_AREAS_SET[value] && value)
            : "Select area..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 mr-7 p-0 border-border">
        <Command>
          <CommandInput placeholder="Search areas..." />
          <CommandList className="bg-popover">
            <CommandEmpty>Area not found</CommandEmpty>
            <CommandGroup>
              {visibleOptions.map((area) => (
                <CommandItem
                  key={area}
                  value={area}
                  onSelect={(currentValue) => {
                    if(currentValue === value) return;
                    setValueStateAction(currentValue)
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