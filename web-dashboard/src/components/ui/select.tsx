"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value: string
  onValueChange: (val: string) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SelectContext = React.createContext<SelectContextType | null>(null)

interface SelectProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

function Select({ defaultValue = "", value: controlledValue, onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)

  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleValueChange = (newVal: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newVal)
    }
    onValueChange?.(newVal)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative inline-block text-left w-full sm:w-auto">{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(SelectContext)

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => ctx?.setOpen((prev) => !prev)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext)
  return <span>{ctx?.value || placeholder || ""}</span>
}

function SelectContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext)
  if (!ctx?.open) return null

  return (
    <div
      className={cn(
        "absolute left-0 z-50 mt-1 min-w-[8rem] w-full rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md animate-in fade-in-80",
        className
      )}
    >
      {children}
    </div>
  )
}

function SelectItem({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(SelectContext)
  const isSelected = ctx?.value === value

  return (
    <div
      onClick={() => ctx?.onValueChange(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100",
        isSelected && "font-semibold bg-slate-50",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
