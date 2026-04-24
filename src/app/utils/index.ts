export interface FetchRequestInterceptCallback {
  (fetch: typeof window.fetch, input: RequestInfo | URL, init?: RequestInit | undefined): Response | Promise<Response>
}


export function fetchRequestIntercept(intercept: FetchRequestInterceptCallback) {
  if (typeof window === 'undefined')
    return
  const { fetch: originalFetch } = window
   window.fetch = async (...args) => {
    const [resource, config] = args
    // request interceptor here
    return intercept(originalFetch, resource, config)
  }
}
