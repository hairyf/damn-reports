import { PropsWithChildren } from "react";
import { Provider } from "./provider";
import { Geist } from "next/font/google";
import { cn } from 'ai-elements'
import { TooltipProvider } from "assistant-ui"

import "./globals.css";
import "assistant-ui/style.css"

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

function Layout(props: PropsWithChildren) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Provider>
          <TooltipProvider>
            {props.children}
          </TooltipProvider>
        </Provider>
      </body>
    </html>
  );
}

export default Layout
