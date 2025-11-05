"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      toastOptions={{
        className:
          "bg-background text-foreground border shadow-lg border-border",
      }}
    />
  );
}

