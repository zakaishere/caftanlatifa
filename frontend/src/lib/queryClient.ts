import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const data = await res.json();
      if (data.error?.issues && Array.isArray(data.error.issues)) {
        const issuesText = data.error.issues.map((i: any) => `${i.path}: ${i.message}`).join(', ');
        throw new Error(`${data.error.message || 'Validation Error'}: ${issuesText}`);
      }
      throw new Error(data.error?.message || data.message || JSON.stringify(data));
    } catch (e: any) {
      if (e.message && e.message !== 'Unexpected end of JSON input') {
        throw e; // rethrow the parsed error
      }
      // fallback
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Store settings can change in another tab while the storefront is open.
queryClient.setQueryDefaults(['/api/public/init'], {
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
});
