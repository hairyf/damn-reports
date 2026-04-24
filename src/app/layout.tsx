"use client"

import { NextServerLoaded } from "./components/next-server-loaded";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./globals.css";

const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <QueryClientProvider client={queryClient}>
        <body className="min-h-full flex flex-col">
          <NextServerLoaded>
            {children}
          </NextServerLoaded>
        </body>
      </QueryClientProvider>
    </html>
  );
}

