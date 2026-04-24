import { PropsWithChildren } from "react";

function Layout(props: PropsWithChildren) {
  return (
    <div className='relative flex h-screen gap-0.5 bg-surface-secondary pt-0'>
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <Main>
          {props.children}
        </Main>
      </div>
    </div>
  );
}

export default Layout
