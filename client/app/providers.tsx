'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * Providers pour React Query
 * 🔧 VERSION DEMO - Configuration React Query avec devtools
 * 
 * Configuration standardisée selon les règles du projet :
 * - staleTime: 0 (toujours refetch)
 * - refetchOnMount: true (refetch au montage)
 * - placeholderData: garde les données pendant le refetch
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // ✅ QueryClient avec useState pour éviter recréation à chaque render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,                    // Toujours refetch
            refetchOnMount: true,           // Refetch au montage
            placeholderData: (previousData) => previousData, // Garde données pendant refetch
            retry: 1,                        // 1 tentative en cas d'erreur
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* ✅ DevTools uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

