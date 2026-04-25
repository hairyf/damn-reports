import { invoke } from '@tauri-apps/api/core';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getAllWebviews, Webview as WebviewType } from '@tauri-apps/api/webview';
import { getCurrentWindow, LogicalPosition, LogicalSize } from '@tauri-apps/api/window';
import { RefObject } from 'react';

export function useWebview(label: string, url: string, elementRef: RefObject<HTMLDivElement | null>) {
  const webviewRef = useRef<WebviewType | null>(null);
  const resizeing = useRef<boolean>(false);
  const oldRect = useRef<DOMRect>(undefined);
  const hidden = useRef<boolean>(false);
  const resizeHiddenTimer = useRef<NodeJS.Timeout>(undefined);
  const initializing = useRef<boolean>(false);

  async function resizeToHidden() {
    if (!hidden.current) {
      await resizeToElement({ width: 0, height: 0 });
      hidden.current = true;
    }
    clearTimeout(resizeHiddenTimer.current);
    resizeHiddenTimer.current = setTimeout(async () => {
      await resizeToElement();
      hidden.current = false;
    }, 500)
  }

  async function resizeToAnimationFrame() {
    requestAnimationFrame(() => resizeToElement());
  }

  async function resizeToElement(override?: Partial<DOMRect>) {
    if (initializing.current) return;
    const boundingClientRect = elementRef.current!.getBoundingClientRect()
    const rect = {
      x: boundingClientRect.left,
      y: boundingClientRect.top,
      width: boundingClientRect.width,
      height: boundingClientRect.height,
      ...override
    } as DOMRect;
    if (isRectEqual(rect, oldRect.current) || resizeing.current) return;
    resizeing.current = true;
    await webviewRef.current?.setPosition(rectToLogicalPosition(rect));
    await webviewRef.current?.setSize(rectToLogicalSize(rect));
    oldRect.current = rect;
    resizeing.current = false;
  }

  useEffect(() => {
    let isAborted = false;
    initializing.current = true;
    async function init() {
      const wv = await getWebview(label);
      if (wv) {
        await wv.close()
        webviewRef.current = null;
      }
      if (isAborted) return;
      const rect = elementRef.current?.getBoundingClientRect()!;
      await invoke<string>('webview_create', {
        label, url,
        x: +rect.left.toFixed(0),
        y: +rect.top.toFixed(0),
        width: +rect.width.toFixed(0),
        height: +rect.height.toFixed(0),
      });
      webviewRef.current = await getWebview(label);
      initializing.current = false;
      invoke<string>('webview_eval', {
        label,
        js: 'console.log("Hello Webview", document)',
      });
    }

    init();

    return () => {
      async function abort() {
        isAborted = true;
        await webviewRef.current?.close();
      }
      abort();
    }
  }, [label, url])

  return {
    ref: webviewRef,
    resizeToHidden,
    resizeToAnimationFrame,
    resizeToElement,
  };
}

export function useObserver(ref: RefObject<HTMLDivElement | null>, fn?: () => void) {
  const resizeObserver = useRef<ResizeObserver | null>(null);

  function resize() {
    fn?.();
  }

  useEffect(() => {
    const currentWindow = getCurrentWindow();
    let unlistenResized: UnlistenFn | undefined
    let unlistenMoved: UnlistenFn | undefined

    resizeObserver.current = new ResizeObserver(() => resize());
    resizeObserver.current.observe(ref.current!);

    currentWindow.onResized(resize).then(un => unlistenResized = un);
    currentWindow.onMoved(resize).then(un => unlistenMoved = un);

    window.addEventListener('scroll', resize, true);

    return () => {
      resizeObserver.current?.disconnect();
      window.removeEventListener('scroll', resize, true);
      unlistenResized?.();
      unlistenMoved?.();
    }
  }, [ref, fn])
}

async function getWebview(label: string) {
  const webviews = await getAllWebviews();
  return webviews.find(w => w.label === label) || null;
}

function isRectEqual(a?: DOMRect, b?: DOMRect) {
  if (!a || !b) return false;
  return a.left === b.left && a.top === b.top &&
    a.width === b.width && a.height === b.height;
}

function rectToLogicalSize(rect: DOMRect) {
  return new LogicalSize(+(rect.width || 0).toFixed(0), +(rect.height || 0).toFixed(0));
}

function rectToLogicalPosition(rect: DOMRect) {
  return new LogicalPosition(rect.x, rect.y);
}
