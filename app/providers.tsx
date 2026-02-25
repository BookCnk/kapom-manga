"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            className: "rtn-toast",
            style: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            },
            success: {
              style: {
                background: "hsl(var(--card))",
                border: "1px solid rgb(249 115 22)", // orange-500
                color: "hsl(var(--foreground))",
              },
              iconTheme: {
                primary: "rgb(249 115 22)", // orange-500
                secondary: "hsl(var(--card))",
              },
            },
            error: {
              style: {
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--destructive))",
                color: "hsl(var(--foreground))",
              },
              iconTheme: {
                primary: "hsl(var(--destructive))",
                secondary: "hsl(var(--card))",
              },
            },
          }}
        />
      </NextThemesProvider>
    </AuthProvider>
  );
}
