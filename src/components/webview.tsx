import { useRef, useId, ReactNode } from 'react';
import { useObserver, useWebview } from './webview.hooks';

export interface WebviewProps {
  autoresize?: boolean;
  className?: string;
  children?: ReactNode;
  url: string;
}

export function Webview(props: WebviewProps) {
  const id = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const webview = useWebview(id, props.url, root);

  useObserver(root, async () => {
    if (props.autoresize)
      await webview.resizeToAnimationFrame();
    else
      await webview.resizeToHidden();
  });

  return (
    <div
      id={id}
      className={props.className}
      style={{ background: 'transparent' }}
      ref={root}
    >
      {props.children}
    </div>
  );
}
