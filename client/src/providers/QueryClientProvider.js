import { QueryClient, QueryClientProvider as Provider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function QueryClientProvider({ children }) {
  return (
    <Provider client={queryClient}>
      {children}
    </Provider>
  );
}
