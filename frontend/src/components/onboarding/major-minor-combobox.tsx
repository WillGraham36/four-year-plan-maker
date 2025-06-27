"use client"
import { CheckIcon, ChevronDown, ChevronsUpDownIcon } from "lucide-react"

import { capitalizeFirstLetter, cn } from "@/lib/utils"
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
import {  ALL_MAJORS, ALL_MINORS } from "@/lib/utils/types"
import { useState } from "react"

interface MajorMinorComboboxProps {
  type: "major" | "minor"
  value: string
  setValueStateAction: React.Dispatch<React.SetStateAction<string>>
}

export function MajorMinorCombobox({
  type,
  value,
  setValueStateAction,
}: MajorMinorComboboxProps) {
  const [open, setOpen] = useState(false);
  const allValues = type === "major" ? ALL_MAJORS : ALL_MINORS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="w-full flex items-center justify-between">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`text-sm font-normal hover:bg-popover transition shadow-md ${!value ? "text-muted-foreground" : ""}`}
        >
          {value
            ? (allValues.includes(value) && value)
            : `Select ${type} ${type === "minor" ? "(optional)" : ""}`}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-border w-[calc(100vw-1rem)] max-w-3xl">
        <Command>
          <CommandInput placeholder={`Search ${type}...`} />
          <CommandList className="bg-popover">
            <CommandEmpty>{capitalizeFirstLetter(type)} not found</CommandEmpty>
            <CommandGroup>
              {/* Only show clear option for minors */}
              {type === "minor" && (
                <CommandItem
                  onSelect={() => {
                    setValueStateAction("");
                    setOpen(false);
                  }}
                  className="italic text-muted-foreground"
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Clear selection
                </CommandItem>
              )}

              {allValues.map((major) => (
                <CommandItem
                  key={major}
                  value={major}
                  onSelect={(currentValue) => {
                    setValueStateAction(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === major ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {major}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}