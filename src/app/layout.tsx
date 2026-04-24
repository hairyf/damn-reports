import { PropsWithChildren } from "react";
import "../globals.css";
import { Provider } from "./provider";

function Layout(props: PropsWithChildren) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Provider>
          <ServiceLoaded>
            {props.children}
          </ServiceLoaded>
        </Provider>
      </body>
    </html>
  );
}

export default Layout
