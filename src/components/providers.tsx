"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RealtimeProvider } from "@upstash/realtime/client";
import { type HTMLAttributes, useState } from "react";
import { Toaster } from "sonner";

type ProvidersProps = HTMLAttributes<HTMLDivElement> & {};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <RealtimeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </RealtimeProvider>
  );
}
