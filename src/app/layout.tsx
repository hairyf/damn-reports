import { PropsWithChildren } from "react";
import "../globals.css";
import { Provider } from "./provider";
import { Geist } from "next/font/google";
import { cn } from 'ai-elements'
import { TooltipProvider } from "ai-elements"

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

function Layout(props: PropsWithChildren) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Provider>
          <ServiceLoaded>
            <TooltipProvider>
              {props.children}
            </TooltipProvider>
          </ServiceLoaded>
        </Provider>
      </body>
    </html>
  );
}

export default Layout
