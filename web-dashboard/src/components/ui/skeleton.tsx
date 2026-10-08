import React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-[#E2E8F0] rounded-[4px] animate-pulse motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
