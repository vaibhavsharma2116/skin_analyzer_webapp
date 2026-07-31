import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DeviceFrameProps {
  title?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DeviceFrame({
  title,
  leftSlot,
  rightSlot,
  footer,
  children,
  className,
}: DeviceFrameProps) {
  return (
    <div className="min-h-screen bg-app-shell px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-[430px] overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-phone">
          <div className="px-6 pt-4">


            {(title || leftSlot || rightSlot) && (
              <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-5">
                <div className="min-w-0">{leftSlot}</div>
                <h1 className="truncate text-center text-base font-semibold text-foreground">{title}</h1>
                <div className="flex justify-end">{rightSlot}</div>
              </header>
            )}
          </div>

          <div className={cn("px-6 pb-6", className)}>{children}</div>

          {footer ? <div className="border-t border-border/70 bg-secondary/35 px-4 py-3">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
