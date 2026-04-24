import { PropsWithChildren } from "react";

function Layout(props: PropsWithChildren) {
  return (
    <div className='relative flex w-full h-screen'>
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
