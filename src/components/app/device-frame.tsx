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
    <div className="min-h-screen bg-app-shell sm:p-6 lg:p-10">
      <div className="mx-auto flex h-[100dvh] max-w-5xl items-center justify-center sm:h-[calc(100vh-3rem)] sm:min-h-[800px]">
        <div className="flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-card shadow-none sm:rounded-[32px] sm:border sm:border-border/70 sm:shadow-phone">
          <div className="shrink-0 px-6 pt-4">
            {(title || leftSlot || rightSlot) && (
              <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-5">
                <div className="min-w-0">{leftSlot}</div>
                <h1 className="truncate text-center text-base font-semibold text-foreground">{title}</h1>
                <div className="flex justify-end">{rightSlot}</div>
              </header>
            )}
          </div>

          <div className={cn("flex-1 overflow-y-auto px-6 pb-6", className)}>{children}</div>

          {footer ? (
            <div className="shrink-0 border-t border-border/70 bg-card/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
