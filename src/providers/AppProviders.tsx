import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnReconnect: true,
          refetchOnWindowFocus: false,
          staleTime: 30_000,
          gcTime: 24 * 60 * 60 * 1000,
        },
        mutations: {
          retry: 0,
        },
      },
    });
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

